import { z } from "zod";

export const UserResponseSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string().nullable(),
  createdAt: z.date(),
  // Exclude sensitive fields like password
});

export type UserResponse = z.infer<typeof UserResponseSchema>;
