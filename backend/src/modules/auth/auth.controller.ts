import { Request, Response } from "express";

import { AuthService } from "./auth.service";
import { loginSchema } from "./auth.validation";

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const data = loginSchema.parse(req.body);

      const result = await AuthService.login(data.email, data.password);

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}
