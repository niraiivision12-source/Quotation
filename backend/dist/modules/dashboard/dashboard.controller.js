"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const dashboard_service_1 = require("@/modules/dashboard/dashboard.service");
class DashboardController {
    static async getSummary(req, res) {
        const result = await dashboard_service_1.DashboardService.getSummary(req.user.id, req.user.role);
        return res.status(200).json({
            success: true,
            data: result,
        });
    }
}
exports.DashboardController = DashboardController;
//# sourceMappingURL=dashboard.controller.js.map