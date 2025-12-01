import { Request } from "express";
import morgan, { StreamOptions } from "morgan";
import logger from "../utils/logger";

// Use Our Logger
const stream: StreamOptions = {
  write: (message) => logger.http(message.trim()),
};

// log All in Dev, Only Errors on Prod
const skip = () => {
  const env = process.env.NODE_ENV || "development";
  return env !== "development";
};

morgan.token("id", (req: any) => req.id || "-");

const morganMiddleware = morgan(
  // [gadf-gaw4ew3...] GET /api/v1/users 200 45ms
  "[:id] :method :url :status :res[content-length] - :response-time ms",
  { stream, skip }
);

export default morganMiddleware;
