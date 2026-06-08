import { Router } from "express";

import { authenticate } from "@/middlewares/auth.middleware";

import { ReminderController } from "@/modules/reminder/reminder.controller";

const router = Router();

router.use(authenticate);

router.post("/", ReminderController.create);

router.get("/my", ReminderController.myReminders);

router.get("/overdue", ReminderController.overdue);

export default router;
