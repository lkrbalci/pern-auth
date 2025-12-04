import bcrypt from "bcryptjs";
import { prisma } from "../db";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { AppError } from "../utils/AppError";
import { User } from "@prisma/client";
import { generateRandomToken, hashToken } from "../utils/crypto";
import { sendPasswordResetEmail, sendVerificationEmail } from "./email.service";
import logger from "../utils/logger";

// Dummy Hash to be used in timing attack prevention
const dummyHash =
  "$2a$10$wI6l0fJH5QpG8b1r6H8U6uJ8vF5eW8jK9jK9jK9jK9jK9jK9jK9jK";

// Helper to get expiry date
const getRefreshTokenExpiry = () => {
  const days = process.env.REFRESH_TOKEN_EXPIRY_DAYS || "7"; // Add this to .env if you want
  return new Date(Date.now() + parseInt(days) * 24 * 60 * 60 * 1000);
};

export const registerUser = async (
  email: string,
  password: string,
  name: string | undefined,
  userAgent: string,
  ipAddress: string,
  shouldSendVerificationEmail: boolean = true
) => {
  // Check Existance
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError("User with this email already exists", 409);
  }

  // Hash Password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Verification Token vars
  let verificationToken: string | null = null;
  let verificationTokenExpiresAt: Date | null = null;
  let rawToken: string | null = null;

  // Verification mail logic is optional. Route and controller decide
  if (shouldSendVerificationEmail) {
    // Generate Verification Token
    rawToken = generateRandomToken();
    verificationToken = hashToken(rawToken);
    verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  }

  // Create User
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      isMailVerified: !shouldSendVerificationEmail, // If no email verification needed, set to true
      verificationToken,
      verificationTokenExpiresAt,
    },
  });

  // Send Verification Email if needed
  if (shouldSendVerificationEmail && rawToken) {
    await sendVerificationEmail(user.email, rawToken).catch((err) => {
      logger.error("Error sending verification email", err);
    });
  }

  if (shouldSendVerificationEmail) {
    // Send Verification Email
    return {
      user,
      accessToken: null,
      refreshToken: null,
      requireVerification: true,
    };
  }

  // Generate Session
  const { accessToken, refreshToken } = await createSession(
    user,
    userAgent,
    ipAddress
  );

  return { user, accessToken, refreshToken, requireVerification: false };
};

export const loginUser = async (
  email: string,
  password: string,
  userAgent: string,
  ipAddress: string
) => {
  // Check Existance
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // User Checks with timing attacks protection
  const targetHash = user ? user.password : dummyHash;
  const isMatch = await bcrypt.compare(password, targetHash);

  if (!isMatch || !user || user.isDeleted) {
    throw new AppError("Invalid credentials", 401);
  }

  if (!user.isMailVerified) {
    throw new AppError("Please verify your email address", 403);
  }

  // Generate Session
  const { accessToken, refreshToken } = await createSession(
    user,
    userAgent,
    ipAddress
  );

  return { user, accessToken, refreshToken };
};

export const logoutUser = async (refreshToken: string) => {
  // Mark Token Revoked
  await prisma.refreshToken.updateMany({
    where: {
      token: refreshToken,
    },
    data: {
      revoked: true,
    },
  });
};

// Session Helper
const createSession = async (
  user: User,
  userAgent: string,
  ipAddress: string
) => {
  const result = await prisma.$transaction(async (tx) => {
    // Create Refresh Token in DB
    const refreshTokenEntry = await tx.refreshToken.create({
      data: {
        userId: user.id,
        expiresAt: getRefreshTokenExpiry(),
        token: "", // Will be set after signing
        userAgent,
        ipAddress,
      },
    });

    const refreshToken = signRefreshToken(user, refreshTokenEntry.id);
    const accessToken = signAccessToken(user);

    // Update Refresh Token with signed token
    await tx.refreshToken.update({
      where: { id: refreshTokenEntry.id },
      data: { token: refreshToken },
    });

    return { accessToken, refreshToken };
  });

  return result;
};

export const refreshSession = async (
  refreshToken: string,
  ipAddress: string,
  userAgent: string
) => {
  // Verify Refresh Token
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new AppError("Invalid refresh token", 401);
  }

  // Find Refresh Token in DB
  const tokenInDb = await prisma.refreshToken.findUnique({
    where: { id: decoded.tokenId },
    include: { user: true },
  });

  if (!tokenInDb) {
    // Valid token but not found in DB (strange, why record deleted?)
    throw new AppError("Invalid Refresh Token", 401);
  }

  if (tokenInDb.revoked) {
    // Token Reuse Detected Possible Theft
    // Revoke all tokens for this user!
    await prisma.refreshToken.updateMany({
      where: { userId: tokenInDb.userId, revoked: false },
      data: { revoked: true },
    });
    throw new AppError("Token Reuse Detected - All Sessions Revoked", 403);
  }

  // Happy Path, All Valid
  const newSession = await prisma.$transaction(async (tx) => {
    // Revoke Old Token
    await tx.refreshToken.update({
      where: { id: tokenInDb.id },
      data: { revoked: true, replacedByToken: "PENDING_NEW" },
    });

    // Create New Refresh Token in DB
    const newEntry = await tx.refreshToken.create({
      data: {
        userId: tokenInDb.userId,
        expiresAt: getRefreshTokenExpiry(), // 7 days
        token: "", // Will be set after signing
        userAgent,
        ipAddress,
      },
    });

    // Update old token to point to new token
    await tx.refreshToken.update({
      where: { id: tokenInDb.id },
      data: { replacedByToken: newEntry.id },
    });

    return newEntry;
  });

  // Sign New Tokens
  const newRefreshToken = signRefreshToken(tokenInDb.user, newSession.id);
  const newAccessToken = signAccessToken(tokenInDb.user);

  // Update DB with the actual token string
  await prisma.refreshToken.update({
    where: { id: newSession.id },
    data: { token: newRefreshToken },
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    user: tokenInDb.user,
  };
};

export const verifyUserEmail = async (token: string) => {
  // Hash the token to copmpare with DB
  const hashedToken = hashToken(token);

  // Find user with this token
  const user = await prisma.user.findFirst({
    where: {
      verificationToken: hashedToken,
      verificationTokenExpiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!user) throw new AppError("Token invalid or expired", 400);

  // Update the User
  await prisma.user.update({
    where: { id: user.id },
    data: {
      isMailVerified: true,
      verificationToken: null, // Cleared after use
      verificationTokenExpiresAt: null,
    },
  });

  return user;
};

export const forgotUserPassword = async (email: string) => {
  const user = await prisma.user.findFirst({
    where: { email, isDeleted: false },
  });

  // Just return, do not give hints
  if (!user) return;

  // Generate Token
  const rawToken = generateRandomToken();
  const hashedToken = hashToken(rawToken);

  // Save Token data to DB
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: hashedToken,
      passwordResetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  await sendPasswordResetEmail(user.email, rawToken);
};

export const resetUserPassword = async (token: string, newPassword: string) => {
  // Hash the token to compare with DB
  const hashedToken = hashToken(token);

  // Find user with this token
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: hashedToken,
      passwordResetTokenExpiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!user) throw new AppError("Token invalid or expired", 400);

  // Hash New Password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // Update the User
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetToken: null, // Cleared after use
      passwordResetTokenExpiresAt: null,
    },
  });

  // Revoke all existing sessions
  await prisma.refreshToken.updateMany({
    where: { userId: user.id },
    data: { revoked: true },
  });
};
