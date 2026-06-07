import { Request, Response } from "express";

import { UserService } from "@/modules/user/user.service";
import { createUserSchema } from "@/modules/user/user.validation";

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

  static async getAll(_req: Request, res: Response) {
    const users = await UserService.getAll();

    return res.status(200).json({
      success: true,
      message: "Users fetched",
      data: users,
    });
  }
}
