import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { ZodError, ZodIssue } from "zod";
import { error } from "console";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = "Internal Server Error";

  // Known App Error
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Zod Errors
  else if (err instanceof ZodError) {
    statusCode = 400;
    const zodErr = err as any;
    message = zodErr.errors
      .map((e: any) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
  } else if (err instanceof SyntaxError) {
    statusCode = 400;
    message = "invalid JSON syntax";
  }

  // Crashes
  if (statusCode === 500) {
    console.error("UNHANDLED ERROR", err);
  }

  res.status(statusCode).json({
    status: statusCode < 500 ? "fail" : error,
    message,
  });
};
