import { Request, Response } from "express";

import { DashboardService } from "@/modules/dashboard/dashboard.service";

export class DashboardController {
  static async getSummary(req: Request, res: Response) {
    const result = await DashboardService.getSummary(
      req.user!.id,
      req.user!.role,
    );
    return res.status(200).json({
      success: true,
      data: result,
    });
  }
}
