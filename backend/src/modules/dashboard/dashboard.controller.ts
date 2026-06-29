import { Request, Response } from "express";
import { DashboardService } from "@/modules/dashboard/dashboard.service";

export class DashboardController {
  static async getSummary(req: Request, res: Response) {
    const period = req.query.period as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const result = await DashboardService.getSummary(
      req.user!.id,
      req.user!.role,
      period,
      startDate,
      endDate
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  }
}
