"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncController = exports.SyncController = void 0;
const zod_1 = require("zod");
const sync_service_1 = require("./sync.service");
const app_error_1 = require("../../utils/app-error");
class SyncController {
    static formatError(error) {
        if (error instanceof zod_1.ZodError) {
            const details = error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
            return `Validation failed: ${details}`;
        }
        if (error instanceof app_error_1.AppError) {
            return error.message;
        }
        if (error instanceof Error) {
            return error.message;
        }
        return 'Unknown error';
    }
    static async syncStockGroups(req, res) {
        try {
            const result = await sync_service_1.syncService.syncStockGroups(req.body);
            return res.status(200).json(result);
        }
        catch (error) {
            const status = error instanceof zod_1.ZodError || (error instanceof app_error_1.AppError && error.statusCode === 400) ? 400 : 500;
            return res.status(status).json({
                success: false,
                error: SyncController.formatError(error)
            });
        }
    }
    static async syncUnits(req, res) {
        try {
            const result = await sync_service_1.syncService.syncUnits(req.body);
            return res.status(200).json(result);
        }
        catch (error) {
            const status = error instanceof zod_1.ZodError || (error instanceof app_error_1.AppError && error.statusCode === 400) ? 400 : 500;
            return res.status(status).json({
                success: false,
                error: SyncController.formatError(error)
            });
        }
    }
    static async syncProducts(req, res) {
        try {
            const result = await sync_service_1.syncService.syncProducts(req.body);
            return res.status(200).json(result);
        }
        catch (error) {
            const status = error instanceof zod_1.ZodError || (error instanceof app_error_1.AppError && error.statusCode === 400) ? 400 : 500;
            return res.status(status).json({
                success: false,
                error: SyncController.formatError(error)
            });
        }
    }
}
exports.SyncController = SyncController;
exports.syncController = SyncController;
//# sourceMappingURL=sync.controller.js.map