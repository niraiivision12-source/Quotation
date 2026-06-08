"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderController = void 0;
const reminder_service_1 = require("@/modules/reminder/reminder.service");
const reminder_validation_1 = require("@/modules/reminder/reminder.validation");
class ReminderController {
    static async create(req, res) {
        const data = reminder_validation_1.createReminderSchema.parse(req.body);
        const reminder = await reminder_service_1.ReminderService.create(req.user.id, data);
        return res.status(201).json({
            success: true,
            message: "Reminder created",
            data: reminder,
        });
    }
    static async myReminders(req, res) {
        const page = Number(req.query.page || 1);
        const limit = Number(req.query.limit || 20);
        const reminders = await reminder_service_1.ReminderService.getMyReminders(req.user.id, page, limit);
        return res.status(200).json({
            success: true,
            data: reminders,
        });
    }
    static async overdue(req, res) {
        const reminders = await reminder_service_1.ReminderService.getOverdue(req.user.id);
        return res.status(200).json({
            success: true,
            data: reminders,
        });
    }
}
exports.ReminderController = ReminderController;
//# sourceMappingURL=reminder.controller.js.map