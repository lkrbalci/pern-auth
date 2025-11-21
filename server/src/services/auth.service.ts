import bcrypt from "bcryptjs";
import { prisma } from "../db";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";

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
    throw new Error("User with this email already exists");
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

  if (!user) {
    throw new Error("Invalid credentials");
  }

  // Verify Password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid credentials");
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

const createSession = async (
  user: any,
  userAgent: string,
  ipAddress: string
) => {
  // Create Refresh Token in DB
  const refreshTokenEntry = await prisma.refreshToken.create({
    data: {
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      token: "", // Will be set after signing
      userAgent,
      ipAddress,
    },
  });

  const refreshToken = signRefreshToken(user, refreshTokenEntry.id);
  const accessToken = signAccessToken(user);

  // Update Refresh Token with signed token
  await prisma.refreshToken.update({
    where: { id: refreshTokenEntry.id },
    data: { token: refreshToken },
  });

  return { accessToken, refreshToken };
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
    throw new Error("Invalid refresh token");
  }

  // Find Refresh Token in DB
  const tokenInDb = await prisma.refreshToken.findUnique({
    where: { id: decoded.tokenId },
    include: { user: true },
  });

  if (!tokenInDb) {
    // Valid token but not found in DB (strange, why record deleted?)
    throw new Error("Invalid Refresh Token");
  }

  if (tokenInDb.revoked) {
    // Token Reuse Detected Possible Theft
    // Revoke all tokens for this user!
    await prisma.refreshToken.updateMany({
      where: { userId: tokenInDb.userId, revoked: false },
      data: { revoked: true },
    });
    throw new Error("Token Reuse Detected - All Sessions Revoked");
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
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
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
