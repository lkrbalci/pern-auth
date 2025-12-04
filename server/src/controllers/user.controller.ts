import { Request, Response } from "express";
import { getUserById } from "../services/user.service";
import {
  UserListResponseSchema,
  UserResponseSchema,
} from "../schemas/user.schema";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/AppError";
import { getAllUsers as getAllUsersService } from "../services/user.service";

export const getMe = catchAsync(
  async (req: Request, res: Response): Promise<any> => {
    const userId = req.user!.userId;
    const userEntity = await getUserById(userId);

    if (!userEntity) {
      throw new AppError("user not found", 404);
    }
    const cleanUser = UserResponseSchema.parse(userEntity);

    return res.json({ user: cleanUser });
  }
);

export const getAllUsers = catchAsync(
  async (req: Request, res: Response): Promise<any> => {
    const users = await getAllUsersService();

    const cleanUsers = UserListResponseSchema.parse(users);

    return res.json({ users: cleanUsers });
  }
);
