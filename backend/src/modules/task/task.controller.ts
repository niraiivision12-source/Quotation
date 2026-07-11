import { Request, Response } from "express";

import { TaskPriority, TaskStatus } from "@prisma/client";

import { TaskService } from "./task.service";

import {
  createTaskSchema,
  updateTaskSchema,
} from "./task.validation";

export class TaskController {
  static async create(req: Request, res: Response) {
    const data = createTaskSchema.parse(req.body);

    const task = await TaskService.create(req.user!.id, data);

    return res.status(201).json({
      success: true,
      message: "Task created",
      data: task,
    });
  }

  static async getAll(req: Request, res: Response) {
    const page = Number(req.query.page || 1);

    const limit = Number(req.query.limit || 20);

    const tasks = await TaskService.getAll(
      page,
      limit,
      {
        status: req.query.status as TaskStatus,

        priority: req.query.priority as TaskPriority,

        assignedToId: req.query.assignedToId as string,

        leadId: req.query.leadId as string,

        customerId: req.query.customerId as string,

        projectId: req.query.projectId as string,

        paymentId: req.query.paymentId as string,

        search: req.query.search as string,

        sortBy: req.query.sortBy as string,

        sortOrder: req.query.sortOrder as "asc" | "desc",
      },
      req.user!.id,
      req.user!.role,
    );

    return res.status(200).json({
      success: true,
      message: "Tasks fetched",
      data: tasks,
    });
  }

  static async getById(req: Request, res: Response) {
    const task = await TaskService.getById(req.params.id as string);

    return res.status(200).json({
      success: true,
      message: "Task fetched",
      data: task,
    });
  }

  static async update(req: Request, res: Response) {
    const data = updateTaskSchema.parse(req.body);

    const task = await TaskService.update(req.params.id as string, data);

    return res.status(200).json({
      success: true,
      message: "Task updated",
      data: task,
    });
  }

  static async complete(req: Request, res: Response) {
    const task = await TaskService.complete(req.params.id as string);

    return res.status(200).json({
      success: true,
      message: "Task completed",
      data: task,
    });
  }

  static async cancel(req: Request, res: Response) {
    const task = await TaskService.cancel(req.params.id as string);

    return res.status(200).json({
      success: true,
      message: "Task cancelled",
      data: task,
    });
  }

  static async remove(req: Request, res: Response) {
    await TaskService.delete(req.params.id as string);

    return res.status(200).json({
      success: true,
      message: "Task deleted",
    });
  }
}
