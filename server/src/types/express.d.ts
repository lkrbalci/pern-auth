import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
      };
      validated?: {
        body?: unknown;
        query?: unknown;
        params?: unknown;
      };
    }
  }
}
