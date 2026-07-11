import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/async-handler";

import { ReminderController } from "./reminder.controller";

const router = Router();

router.use(authenticate);

router.post("/", asyncHandler(ReminderController.create));

router.get("/my", asyncHandler(ReminderController.myReminders));

router.get("/overdue", asyncHandler(ReminderController.overdue));

router.get("/:id", asyncHandler(ReminderController.getById));

router.patch("/:id", asyncHandler(ReminderController.update));

router.patch("/:id/complete", asyncHandler(ReminderController.complete));

router.delete("/:id", asyncHandler(ReminderController.remove));

export default router;
