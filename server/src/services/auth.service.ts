import bcrypt from "bcryptjs";
import { prisma } from "../db";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { AppError } from "../utils/AppError";
import { User } from "@prisma/client";

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
  ipAddress: string
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

  // Create User
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
  });

  // Generate Session
  const { accessToken, refreshToken } = await createSession(
    user,
    userAgent,
    ipAddress
  );

  return { user, accessToken, refreshToken };
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

  if (!isMatch || !user) {
    throw new AppError("Invalid credentials", 401);
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
