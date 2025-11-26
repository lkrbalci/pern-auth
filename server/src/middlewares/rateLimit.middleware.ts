import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { AppError } from "../utils/AppError";

// Global Rate Limiter Allows 100 requests per 15 minutes
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 Reqs
  message: {
    status: "fail",
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Auth Rate Limiter Allows 10 requests per hour
export const authRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 Reqs
  handler: (req: Request, res: Response, next: NextFunction) => {
    next(
      new AppError(
        "Too many authentication attempts from this IP, please try again later.",
        429
      )
    );
  },
  standardHeaders: true,
  legacyHeaders: false,
});
