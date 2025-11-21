import { Request } from "express";

export const getRequestMeta = (req: Request) => {
  const rawUserAgent = req.headers["user-agent"] || "Unknown";

  const userAgent = Array.isArray(rawUserAgent)
    ? rawUserAgent.join(" ")
    : rawUserAgent;

  const ipAddress = req.ip || req.socket.remoteAddress || "Unknown";
  return { userAgent, ipAddress };
};
