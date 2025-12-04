import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { Role } from "@prisma/client";

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
    req.user = { userId: payload.userId, role: payload.role };

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const authorize = (allowedRoles: Role[]) => {
  // Factory pattern function to check roles
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authantication required" });
    }

    // Check if user role is in allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: Access is denied" });
    }

    next();
  };
};
