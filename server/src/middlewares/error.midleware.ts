import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { ZodError } from "zod";
import logger from "../utils/logger";

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
    const zodErr = err as ZodError;
    message = zodErr.issues
      .map((e: any) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
  } else if (err instanceof SyntaxError) {
    statusCode = 400;
    message = "Bad Request";
  }

  // Crashes
  if (statusCode === 500) {
    logger.error(`!!! UNHANDLED ERROR: ${message}`);
    logger.error(err.stack);
  }

  if (statusCode >= 400 && statusCode < 500) {
    logger.warn(
      `! [${statusCode}] ${message} - ${req.originalUrl} - IP: ${req.ip}`
    );
  }

  res.status(statusCode).json({
    status: statusCode < 500 ? "fail" : "error",
    message,
  });
};
