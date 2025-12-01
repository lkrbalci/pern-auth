import { prisma } from "../db";

export const getUserById = async (userId: string) => {
  return prisma.user.findFirst({
    where: { id: userId, isDeleted: false },
  });
};
