import { Request, Response } from "express";

import { AuthService } from "./auth.service";
import { loginSchema } from "./auth.validation";

export class AuthController {
  static async login(req: Request, res: Response) {
    const data = loginSchema.parse(req.body);

    const result = await AuthService.login(data.email, data.password);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  }

  static async me(req: Request, res: Response) {
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  }
}
