import { Request, Response } from "express";

import { DashboardService } from "@/modules/dashboard/dashboard.service";

export class DashboardController {
  static async getSummary(_req: Request, res: Response) {
    const result = await DashboardService.getSummary();

    return res.status(200).json({
      success: true,
      data: result,
    });
  }
}
