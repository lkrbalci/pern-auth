import { Request, Response } from "express";
import {
  loginUser,
  logoutUser,
  refreshSession,
  registerUser,
} from "../services/auth.service";
import { getRequestMeta } from "../utils/request";
import { catchAsync } from "../utils/catchAsync";
import { UserResponseSchema } from "../schemas/user.schema";
import { AppError } from "../utils/AppError";

const getCookieOptions = () => {
  const days = parseInt(process.env.REFRESH_TOKEN_EXPIRY_DAYS || "7");
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: days * 24 * 60 * 60 * 1000, // Milliseconds
  };
};

export const register = catchAsync(
  async (req: Request, res: Response): Promise<Response> => {
    const { email, password, name } = req.validated!.body;
    const { userAgent, ipAddress } = getRequestMeta(req);
    const { user, accessToken, refreshToken } = await registerUser(
      email,
      password,
      name,
      userAgent,
      ipAddress
    );

    const cleanUser = UserResponseSchema.parse(user);

    // Set HttpOnly Cookie
    res.cookie("refreshToken", refreshToken, getCookieOptions());

    return res.status(201).json({
      user: cleanUser,
      accessToken,
    });
  }
);

export const login = catchAsync(
  async (req: Request, res: Response): Promise<Response> => {
    const { email, password } = req.validated!.body;
    const { userAgent, ipAddress } = getRequestMeta(req);

    const { user, accessToken, refreshToken } = await loginUser(
      email,
      password,
      userAgent,
      ipAddress
    );

    const cleanUser = UserResponseSchema.parse(user);

    // Set HttpOnly Cookie
    res.cookie("refreshToken", refreshToken, getCookieOptions());

    return res.json({
      message: "Login successful",
      accessToken,
      user: cleanUser,
    });
  }
);

export const logout = catchAsync(
  async (req: Request, res: Response): Promise<Response> => {
    // Clear the refresh token cookie
    const { refreshToken } = req.validated!.cookies;

    if (refreshToken) {
      await logoutUser(refreshToken);
    }

    res.clearCookie("refreshToken", getCookieOptions());

    return res.json({ message: "Logout successful" });
  }
);

export const refresh = catchAsync(
  async (req: Request, res: Response): Promise<Response> => {
    // Get Cookie
    const { refreshToken } = req.validated!.cookies;

    const { userAgent, ipAddress } = getRequestMeta(req);

    try {
      // Call Service to Refresh Tokens
      const {
        accessToken,
        refreshToken: newRefreshToken,
        user,
      } = await refreshSession(refreshToken, ipAddress, userAgent);

      const cleanUser = UserResponseSchema.parse(user);

      // Set New HttpOnly Cookie
      res.cookie("refreshToken", newRefreshToken, getCookieOptions());

      return res.json({
        message: "Session refreshed",
        accessToken,
        user: cleanUser,
      });
    } catch (error) {
      // If something goes wrong, force logout
      res.clearCookie("refreshToken", getCookieOptions());

      throw error;
    }
  }
);
