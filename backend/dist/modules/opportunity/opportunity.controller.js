"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpportunityController = void 0;
const opportunity_service_1 = require("./opportunity.service");
const opportunity_validation_1 = require("./opportunity.validation");
class OpportunityController {
    static async getAll(req, res) {
        const page = Number(req.query.page || 1);
        const limit = Number(req.query.limit || 20);
        const search = req.query.search?.toString();
        const filters = {
            category: req.query.category,
            status: req.query.status,
        };
        const data = await opportunity_service_1.OpportunityService.getAll(req.user.id, req.user.role, page, limit, search, filters);
        return res.status(200).json({
            success: true,
            message: "Opportunities fetched",
            data,
        });
    }
    static async getById(req, res) {
        const { id } = req.params;
        const opportunity = await opportunity_service_1.OpportunityService.getById(id, req.user.id, req.user.role);
        return res.status(200).json({
            success: true,
            message: "Opportunity fetched",
            data: opportunity,
        });
    }
    static async update(req, res) {
        const { id } = req.params;
        const data = opportunity_validation_1.updateOpportunitySchema.parse(req.body);
        const opportunity = await opportunity_service_1.OpportunityService.update(id, req.user.id, req.user.role, data);
        return res.status(200).json({
            success: true,
            message: "Opportunity updated",
            data: opportunity,
        });
    }
    static async getCounts(req, res) {
        const category = req.query.category;
        const search = req.query.search?.toString();
        const counts = await opportunity_service_1.OpportunityService.getStatusCounts(category, search);
        return res.status(200).json({
            success: true,
            message: "Opportunity status counts fetched",
            data: counts,
        });
    }
    static async getStats(req, res) {
        const stats = await opportunity_service_1.OpportunityService.getStats(req.user.id, req.user.role);
        return res.status(200).json({
            success: true,
            message: "Opportunity stats fetched",
            data: stats,
        });
    }
    static async remove(req, res) {
        const { id } = req.params;
        await opportunity_service_1.OpportunityService.delete(id);
        return res.status(200).json({
            success: true,
            message: "Opportunity deleted successfully",
        });
    }
}
exports.OpportunityController = OpportunityController;
//# sourceMappingURL=opportunity.controller.js.map