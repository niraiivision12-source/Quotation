"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LifecycleController = void 0;
const lifecycle_service_1 = require("@/modules/lifecycle/lifecycle.service");
const lifecycle_validation_1 = require("@/modules/lifecycle/lifecycle.validation");
class LifecycleController {
    static async getProjectLifecycle(req, res) {
        const result = await lifecycle_service_1.LifecycleService.getProjectLifecycle(req.params.projectId);
        return res.status(200).json({
            success: true,
            data: result,
        });
    }
    static async updatePhase(req, res) {
        const data = lifecycle_validation_1.updatePhaseSchema.parse(req.body);
        const result = await lifecycle_service_1.LifecycleService.updatePhase(req.params.id, data);
        return res.status(200).json({
            success: true,
            message: "Phase updated",
            data: result,
        });
    }
}
exports.LifecycleController = LifecycleController;
//# sourceMappingURL=lifecycle.controller.js.map