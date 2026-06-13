import { Request, Response } from "express";

import { UserService } from "@/modules/user/user.service";
import {
  createUserSchema,
  updateUserSchema,
} from "@/modules/user/user.validation";

export class UserController {
  static async create(req: Request, res: Response) {
    const data = createUserSchema.parse(req.body);

    const user = await UserService.create(data);

    return res.status(201).json({
      success: true,
      message: "User created",
      data: user,
    });
  }

  static async getAll(req: Request, res: Response) {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    const users = await UserService.getAll(page, limit);

    return res.status(200).json({
      success: true,
      message: "Users fetched",
      data: users,
    });
  }

  static async getById(req: Request, res: Response) {
    const user = await UserService.getById(req.params.id as string);

    return res.status(200).json({
      success: true,
      message: "User fetched",
      data: user,
    });
  }

  static async update(req: Request, res: Response) {
    const data = updateUserSchema.parse(req.body);

    const user = await UserService.update(req.params.id as string, data);

    return res.status(200).json({
      success: true,
      message: "User updated",
      data: user,
    });
  }

  static async deactivate(req: Request, res: Response) {
    const user = await UserService.deactivate(req.params.id as string);

    return res.status(200).json({
      success: true,
      message: "User deactivated",
      data: user,
    });
  }
}
