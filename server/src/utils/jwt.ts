import jwt, { SignOptions } from "jsonwebtoken";
import { User } from "@prisma/client";

// Retrieve secrets from env (fail fast if missing)
const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET;

const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "15m";
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "7d";

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error("FATAL: JWT Secrets are not defined in .env");
}

// Generate Access Token (Short lived, 15m)
export const signAccessToken = (user: User) => {
  const options: SignOptions = {
    expiresIn: (ACCESS_TOKEN_EXPIRY || "15m") as SignOptions["expiresIn"],
  };

  return jwt.sign({ userId: user.id }, ACCESS_SECRET, options);
};

// Generate Refresh Token (Long lived, 7d)
export const signRefreshToken = (user: User, tokenId: string) => {
  const options: SignOptions = {
    expiresIn: (REFRESH_TOKEN_EXPIRY || "7d") as SignOptions["expiresIn"],
  };
  return jwt.sign({ userId: user.id, tokenId }, REFRESH_SECRET, options);
};

// Verify Access Token
export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, ACCESS_SECRET) as { userId: string };
};

// Verify Refresh Token
export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, REFRESH_SECRET) as {
    userId: string;
    tokenId: string;
  };
};
