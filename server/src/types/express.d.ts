import { Request } from "express";
import { Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      // request.user for auth
      user?: {
        userId: string;
        role: Role;
      };
      // request.validated for validation
      validated?: {
        body?: any;
        query?: any;
        params?: any;
        cookies?: any;
      };
      // request.id for tracing request
      id?: string;
    }
  }
}
