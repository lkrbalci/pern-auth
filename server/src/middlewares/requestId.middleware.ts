import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

export const requestId = (req: Request, res: Response, next: NextFunction) => {
  // Check for existing request ID in headers
  const headerValue = req.headers["x-request-id"];

  // check if headerValue is an array (kind of types requirement)
  const requestId = Array.isArray(headerValue) ? headerValue[0] : headerValue;

  // If no request ID from client, generate a new request ID
  const id = requestId || uuidv4();

  req.id = id;
  res.setHeader("X-Request-Id", id);

  next();
};
