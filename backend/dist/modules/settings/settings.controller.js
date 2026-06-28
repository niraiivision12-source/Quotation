"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsController = void 0;
const settings_service_1 = require("./settings.service");
const settings_validation_1 = require("./settings.validation");
const app_error_1 = require("@/utils/app-error");
class SettingsController {
    static async get(_req, res) {
        const settings = await settings_service_1.SettingsService.getSettings();
        return res.status(200).json({
            success: true,
            data: settings,
        });
    }
    static async update(req, res) {
        const parsed = settings_validation_1.updateSettingsSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: "Validation Error",
                errors: parsed.error.format(),
            });
        }
        const updated = await settings_service_1.SettingsService.updateSettings(parsed.data);
        return res.status(200).json({
            success: true,
            message: "Settings updated successfully",
            data: updated,
        });
    }
    static async export(_req, res) {
        const data = await settings_service_1.SettingsService.exportSettings();
        return res.status(200).json({
            success: true,
            data,
        });
    }
    static async import(req, res) {
        try {
            const updated = await settings_service_1.SettingsService.importSettings(req.body);
            return res.status(200).json({
                success: true,
                message: "Settings imported successfully",
                data: updated,
            });
        }
        catch (error) {
            throw new app_error_1.AppError(error.message || "Failed to import settings", 400);
        }
    }
}
exports.SettingsController = SettingsController;
//# sourceMappingURL=settings.controller.js.map