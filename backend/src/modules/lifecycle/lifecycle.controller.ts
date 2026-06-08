import { Request, Response } from "express";

import { LifecycleService } from "@/modules/lifecycle/lifecycle.service";

import { updatePhaseSchema } from "@/modules/lifecycle/lifecycle.validation";

export class LifecycleController {
  static async getProjectLifecycle(req: Request, res: Response) {
    const result = await LifecycleService.getProjectLifecycle(
      req.params.projectId as string,
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  }

  static async updatePhase(req: Request, res: Response) {
    const data = updatePhaseSchema.parse(req.body);

    const result = await LifecycleService.updatePhase(
      req.params.id as string,
      data,
    );

    return res.status(200).json({
      success: true,
      message: "Phase updated",
      data: result,
    });
  }
}
