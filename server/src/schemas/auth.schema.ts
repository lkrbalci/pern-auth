import { z } from "zod";

export const RegisterSchema = z.object({
  body: z.object({
    email: z.email("Invalid email address"),
    password: z
      .string("Password is required")
      .min(6, { error: "Password must be at least 6 characters long" })
      .max(100, { error: "Password must be at most 100 characters long" }),
    name: z
      .string()
      .min(2, { error: "Name must be at least 2 characters long" })
      .optional(),
  }),
});

export const LoginSchema = z.object({
  body: z.object({
    email: z.email({ error: "Invalid email address" }),
    password: z.string({ error: "Password is required" }),
  }),
});

export const RefreshSchema = z.object({
  cookies: z.object({
    refreshToken: z
      .string({ error: "Refresh token is required" })
      .min(1, { error: "Refresh token cannot be empty" }),
  }),
});

export type RegisterInput = z.infer<typeof RegisterSchema>["body"];
export type LoginInput = z.infer<typeof LoginSchema>["body"];
