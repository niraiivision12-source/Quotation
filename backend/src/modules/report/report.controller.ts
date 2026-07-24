import { Request, Response, NextFunction } from "express";
import { ReportService } from "./report.service";

export class ReportController {
  static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      const data = await ReportService.getSummary(
        startDate as string | undefined,
        endDate as string | undefined
      );
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}
