import { Request, Response } from "express";
import {
  loginUser,
  logoutUser,
  refreshSession,
  registerUser,
} from "../services/auth.service";
import { getRequestMeta } from "../utils/request";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const register = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password, name } = req.body;
    const { userAgent, ipAddress } = getRequestMeta(req);

    const { user, accessToken, refreshToken } = await registerUser(
      email,
      password,
      name,
      userAgent,
      ipAddress
    );

    // Set HttpOnly Cookie
    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      accessToken,
    });
  } catch (error: any) {
    // Implement proper error handling with midlleware
    if (error.message == "User with this email already exists") {
      return res.status(400).json({ error: error.message });
    }
    console.error("Registration Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;
    const { userAgent, ipAddress } = getRequestMeta(req);

    const { user, accessToken, refreshToken } = await loginUser(
      email,
      password,
      userAgent,
      ipAddress
    );

    // Set HttpOnly Cookie
    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

    return res.json({
      message: "Login successful",
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    // Implement proper error handling with midlleware
    if (error.message == "Invalid credentials") {
      return res.status(401).json({ error: error.message });
    }
    console.error("Login Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const logout = async (req: Request, res: Response): Promise<any> => {
  try {
    // Clear the refresh token cookie
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      await logoutUser(refreshToken);
    }

    res.clearCookie("refreshToken", COOKIE_OPTIONS);

    return res.json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const refresh = async (req: Request, res: Response): Promise<any> => {
  try {
    // Get Cookie
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh Token not found" });
    }

    const { userAgent, ipAddress } = getRequestMeta(req);

    // Call Service to Refresh Tokens
    const {
      accessToken,
      refreshToken: newRefreshToken,
      user,
    } = await refreshSession(refreshToken, ipAddress, userAgent);

    // Set New HttpOnly Cookie
    res.cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS);

    return res.json({
      message: "Session refreshed",
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    // If something goes wrong, force logout
    res.clearCookie("refreshToken", COOKIE_OPTIONS);

    if (error.message.includes("Reuse") || error.message.includes("Invalid")) {
      return res.status(403).json({ message: "Session Invalid or Expired" });
    }
    console.error("Refresh Session Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
