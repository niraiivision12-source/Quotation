import { Request, Response } from "express";

import { ProjectService } from "@/modules/project/project.service";
import {
  createProjectSchema,
  updateProjectSchema,
} from "@/modules/project/project.validation";

export class ProjectController {
  static async create(req: Request, res: Response) {
    const data = createProjectSchema.parse(req.body);

    const project = await ProjectService.create(data);

    return res.status(201).json({
      success: true,
      message: "Project created",
      data: project,
    });
  }

  static async getAll(req: Request, res: Response) {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);

    const search = req.query.search?.toString();

    const projects = await ProjectService.getAll(page, limit, search);

    return res.status(200).json({
      success: true,
      message: "Projects fetched",
      data: projects,
    });
  }

  static async getById(req: Request, res: Response) {
    const project = await ProjectService.getById(req.params.id as string);

    return res.status(200).json({
      success: true,
      message: "Project fetched",
      data: project,
    });
  }

  static async update(req: Request, res: Response) {
    const data = updateProjectSchema.parse(req.body);

    const project = await ProjectService.update(req.params.id as string, data);

    return res.status(200).json({
      success: true,
      message: "Project updated",
      data: project,
    });
  }

  static async deactivate(req: Request, res: Response) {
    const project = await ProjectService.deactivate(req.params.id as string);

    return res.status(200).json({
      success: true,
      message: "Project deactivated",
      data: project,
    });
  }
}
