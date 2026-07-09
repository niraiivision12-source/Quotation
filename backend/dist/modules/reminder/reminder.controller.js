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
        const projectId = req.query.projectId?.toString();
        const reminders = await reminder_service_1.ReminderService.getMyReminders(req.user.id, req.user.role, page, limit, projectId);
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
    static async getById(req, res) {
        const reminder = await reminder_service_1.ReminderService.getById(req.params.id, req.user.id, req.user.role);
        return res.status(200).json({
            success: true,
            data: reminder,
        });
    }
    static async update(req, res) {
        const data = reminder_validation_1.updateReminderSchema.parse(req.body);
        const reminder = await reminder_service_1.ReminderService.update(req.params.id, req.user.id, req.user.role, data);
        return res.status(200).json({
            success: true,
            message: "Reminder updated",
            data: reminder,
        });
    }
    static async complete(req, res) {
        const reminder = await reminder_service_1.ReminderService.complete(req.params.id, req.user.id, req.user.role);
        return res.status(200).json({
            success: true,
            message: "Reminder completed",
            data: reminder,
        });
    }
    static async remove(req, res) {
        await reminder_service_1.ReminderService.delete(req.params.id, req.user.id, req.user.role);
        return res.status(200).json({
            success: true,
            message: "Reminder deleted",
        });
    }
}
exports.ReminderController = ReminderController;
//# sourceMappingURL=reminder.controller.js.map