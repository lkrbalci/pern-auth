import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
      };
      validated?: {
        body?: any;
        query?: any;
        params?: any;
        cookies?: any;
      };
    }
  }
}
