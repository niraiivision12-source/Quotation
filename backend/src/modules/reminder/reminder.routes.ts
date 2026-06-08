import { Router } from "express";

import { authenticate } from "@/middlewares/auth.middleware";
import { asyncHandler } from "@/utils/async-handler";

import { ReminderController } from "@/modules/reminder/reminder.controller";

const router = Router();

router.use(authenticate);

router.post("/", asyncHandler(ReminderController.create));

router.get("/my", asyncHandler(ReminderController.myReminders));

router.get("/overdue", asyncHandler(ReminderController.overdue));

export default router;
