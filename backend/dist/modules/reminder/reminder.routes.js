"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const async_handler_1 = require("../../utils/async-handler");
const reminder_controller_1 = require("./reminder.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post("/", (0, async_handler_1.asyncHandler)(reminder_controller_1.ReminderController.create));
router.get("/my", (0, async_handler_1.asyncHandler)(reminder_controller_1.ReminderController.myReminders));
router.get("/overdue", (0, async_handler_1.asyncHandler)(reminder_controller_1.ReminderController.overdue));
router.get("/:id", (0, async_handler_1.asyncHandler)(reminder_controller_1.ReminderController.getById));
router.patch("/:id", (0, async_handler_1.asyncHandler)(reminder_controller_1.ReminderController.update));
router.patch("/:id/complete", (0, async_handler_1.asyncHandler)(reminder_controller_1.ReminderController.complete));
router.delete("/:id", (0, async_handler_1.asyncHandler)(reminder_controller_1.ReminderController.remove));
exports.default = router;
//# sourceMappingURL=reminder.routes.js.map