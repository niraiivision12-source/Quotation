import { Request, Response } from "express";

import { ReminderService } from "@/modules/reminder/reminder.service";

import { createReminderSchema } from "@/modules/reminder/reminder.validation";

export class ReminderController {
  static async create(req: Request, res: Response) {
    const data = createReminderSchema.parse(req.body);

    const reminder = await ReminderService.create(req.user!.id, data);

    return res.status(201).json({
      success: true,
      message: "Reminder created",
      data: reminder,
    });
  }

  static async myReminders(req: Request, res: Response) {
    const page = Number(req.query.page || 1);

    const limit = Number(req.query.limit || 20);

    const reminders = await ReminderService.getMyReminders(
      req.user!.id,
      page,
      limit,
    );

    return res.status(200).json({
      success: true,
      data: reminders,
    });
  }

  static async overdue(req: Request, res: Response) {
    const reminders = await ReminderService.getOverdue(req.user!.id);

    return res.status(200).json({
      success: true,
      data: reminders,
    });
  }
}
