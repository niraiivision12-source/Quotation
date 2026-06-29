import { Request, Response } from "express";
import { SettingsService } from "./settings.service";
import { updateSettingsSchema } from "./settings.validation";
import { AppError } from "@/utils/app-error";

export class SettingsController {
  static async get(_req: Request, res: Response) {
    const settings = await SettingsService.getSettings();
    return res.status(200).json({
      success: true,
      data: settings,
    });
  }

  static async update(req: Request, res: Response) {
    const parsed = updateSettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: parsed.error.format(),
      });
    }

    const updated = await SettingsService.updateSettings(parsed.data);
    return res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: updated,
    });
  }

  static async export(_req: Request, res: Response) {
    const data = await SettingsService.exportSettings();
    return res.status(200).json({
      success: true,
      data,
    });
  }

  static async import(req: Request, res: Response) {
    try {
      const updated = await SettingsService.importSettings(req.body);
      return res.status(200).json({
        success: true,
        message: "Settings imported successfully",
        data: updated,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to import settings";
      throw new AppError(message, 400);
    }
  }
}
