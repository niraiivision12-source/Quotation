import { Request, Response } from "express";

import { LifecycleService } from "@/modules/lifecycle/lifecycle.service";

import { updatePhaseSchema } from "@/modules/lifecycle/lifecycle.validation";

type LifecycleParams = {
  projectId: string;
  id: string;
};

export class LifecycleController {
  static async getProjectLifecycle(
    req: Request<LifecycleParams>,
    res: Response,
  ) {
    const result = await LifecycleService.getProjectLifecycle(
      req.params.projectId,
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  }

  static async updatePhase(req: Request<LifecycleParams>, res: Response) {
    const data = updatePhaseSchema.parse(req.body);

    const result = await LifecycleService.updatePhase(req.params.id, data);

    return res.status(200).json({
      success: true,
      message: "Phase updated",
      data: result,
    });
  }
}
