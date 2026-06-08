"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("@/middlewares/auth.middleware");
const reminder_controller_1 = require("@/modules/reminder/reminder.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post("/", reminder_controller_1.ReminderController.create);
router.get("/my", reminder_controller_1.ReminderController.myReminders);
router.get("/overdue", reminder_controller_1.ReminderController.overdue);
exports.default = router;
//# sourceMappingURL=reminder.routes.js.map