"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskController = void 0;
const task_service_1 = require("./task.service");
const task_validation_1 = require("./task.validation");
class TaskController {
    static async create(req, res) {
        const data = task_validation_1.createTaskSchema.parse(req.body);
        const task = await task_service_1.TaskService.create(req.user.id, data);
        return res.status(201).json({
            success: true,
            message: "Task created",
            data: task,
        });
    }
    static async getAll(req, res) {
        const page = Number(req.query.page || 1);
        const limit = Number(req.query.limit || 20);
        const tasks = await task_service_1.TaskService.getAll(page, limit, {
            status: req.query.status,
            priority: req.query.priority,
            assignedToId: req.query.assignedToId,
            leadId: req.query.leadId,
            customerId: req.query.customerId,
            projectId: req.query.projectId,
            paymentId: req.query.paymentId,
            search: req.query.search,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder,
        }, req.user.id, req.user.role);
        return res.status(200).json({
            success: true,
            message: "Tasks fetched",
            data: tasks,
        });
    }
    static async getById(req, res) {
        const task = await task_service_1.TaskService.getById(req.params.id);
        return res.status(200).json({
            success: true,
            message: "Task fetched",
            data: task,
        });
    }
    static async update(req, res) {
        const data = task_validation_1.updateTaskSchema.parse(req.body);
        const task = await task_service_1.TaskService.update(req.params.id, data);
        return res.status(200).json({
            success: true,
            message: "Task updated",
            data: task,
        });
    }
    static async complete(req, res) {
        const task = await task_service_1.TaskService.complete(req.params.id);
        return res.status(200).json({
            success: true,
            message: "Task completed",
            data: task,
        });
    }
    static async cancel(req, res) {
        const task = await task_service_1.TaskService.cancel(req.params.id);
        return res.status(200).json({
            success: true,
            message: "Task cancelled",
            data: task,
        });
    }
    static async remove(req, res) {
        await task_service_1.TaskService.delete(req.params.id);
        return res.status(200).json({
            success: true,
            message: "Task deleted",
        });
    }
}
exports.TaskController = TaskController;
//# sourceMappingURL=task.controller.js.map