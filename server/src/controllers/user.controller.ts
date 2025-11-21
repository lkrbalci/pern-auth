import { Request, Response } from "express";
import { getUserById } from "../services/user.service";
import { UserResponseSchema } from "../schemas/user.schema";

export const getMe = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.user!.userId;
    const userEntity = await getUserById(userId);

    if (!userEntity) {
      return res.status(404).json({ error: "User not found" });
    }
    const cleanUser = UserResponseSchema.parse(userEntity);

    return res.json({ user: cleanUser });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
