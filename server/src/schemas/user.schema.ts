import { Role } from "@prisma/client";
import { z } from "zod";

// Exclude sensitive fields like password
export const UserResponseSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string().nullable(),
  role: z.enum(Role),
  isDeleted: z.boolean(),
  isMailVerified: z.boolean(),
  createdAt: z.date(),
});

export const UserListResponseSchema = z.array(UserResponseSchema);

export type UserResponse = z.infer<typeof UserResponseSchema>;
