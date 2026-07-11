"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const user_service_1 = require("./user.service");
const user_validation_1 = require("./user.validation");
class UserController {
    static async create(req, res) {
        const data = user_validation_1.createUserSchema.parse(req.body);
        const user = await user_service_1.UserService.create(data);
        return res.status(201).json({
            success: true,
            message: "User created",
            data: user,
        });
    }
    static async getAll(req, res) {
        const page = Number(req.query.page || 1);
        const limit = Number(req.query.limit || 10);
        const users = await user_service_1.UserService.getAll(page, limit);
        return res.status(200).json({
            success: true,
            message: "Users fetched",
            data: users,
        });
    }
    static async getById(req, res) {
        const user = await user_service_1.UserService.getById(req.params.id);
        return res.status(200).json({
            success: true,
            message: "User fetched",
            data: user,
        });
    }
    static async update(req, res) {
        const data = user_validation_1.updateUserSchema.parse(req.body);
        const user = await user_service_1.UserService.update(req.params.id, data);
        return res.status(200).json({
            success: true,
            message: "User updated",
            data: user,
        });
    }
    static async deactivate(req, res) {
        const user = await user_service_1.UserService.deactivate(req.params.id);
        return res.status(200).json({
            success: true,
            message: "User deactivated",
            data: user,
        });
    }
}
exports.UserController = UserController;
//# sourceMappingURL=user.controller.js.map