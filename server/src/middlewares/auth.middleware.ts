import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get Authorization Header "Bearer token"
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authantication required" });
    }

    // Get Token
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Authantication required" });
    }

    // Verify Token
    const payload = verifyAccessToken(token);
    // Attach user to request object
    req.user = payload;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
