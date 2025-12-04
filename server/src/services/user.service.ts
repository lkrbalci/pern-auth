import { prisma } from "../db";

export const getUserById = async (userId: string) => {
  return prisma.user.findFirst({
    where: { id: userId, isDeleted: false },
  });
};

export const getAllUsers = async () => {
  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isDeleted: true,
      isMailVerified: true,
      createdAt: true,
    },
  });
};
