import crypto from "crypto";

//Generate a random token
export const generateRandomToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

// Hash it to protect token
export const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};
