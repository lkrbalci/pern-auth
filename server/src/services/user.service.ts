import { prisma } from "../db";

export const getUserById = async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
  });
};
