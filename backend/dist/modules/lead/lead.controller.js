"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadController = void 0;
const lead_service_1 = require("./lead.service");
const lead_validation_1 = require("./lead.validation");
class LeadController {
    static async create(req, res) {
        const data = lead_validation_1.createLeadSchema.parse(req.body);
        const lead = await lead_service_1.LeadService.create(data);
        return res.status(201).json({
            success: true,
            message: "Lead created",
            data: lead,
        });
    }
    static async getStats(_req, res) {
        const stats = await lead_service_1.LeadService.getStats();
        return res.status(200).json({ success: true, data: stats });
    }
    static async getAll(req, res) {
        const page = Number(req.query.page || 1);
        const limit = Number(req.query.limit || 20);
        const search = req.query.search?.toString();
        const filters = {
            source: req.query.source?.toString(),
            status: req.query.status?.toString(),
            assignedToId: req.query.assignedToId?.toString(),
            city: req.query.city?.toString(),
            dateFrom: req.query.dateFrom?.toString(),
            dateTo: req.query.dateTo?.toString(),
            phase: req.query.phase?.toString(),
        };
        const leads = await lead_service_1.LeadService.getAll(page, limit, search, filters);
        return res.status(200).json({
            success: true,
            message: "Leads fetched",
            data: leads,
        });
    }
    static async getById(req, res) {
        const lead = await lead_service_1.LeadService.getById(req.params.id);
        return res.status(200).json({
            success: true,
            message: "Lead fetched",
            data: lead,
        });
    }
    static async convert(req, res) {
        const data = lead_validation_1.convertLeadSchema.parse(req.body);
        const result = await lead_service_1.LeadService.convert(req.params.id, data);
        return res.status(200).json({
            success: true,
            message: "Lead converted successfully",
            data: result,
        });
    }
    static async update(req, res) {
        const data = lead_validation_1.updateLeadSchema.parse(req.body);
        const lead = await lead_service_1.LeadService.update(req.params.id, req.user.id, data);
        return res.status(200).json({
            success: true,
            message: "Lead updated",
            data: lead,
        });
    }
    static async deactivate(req, res) {
        const lead = await lead_service_1.LeadService.deactivate(req.params.id);
        return res.status(200).json({
            success: true,
            message: "Lead deactivated",
            data: lead,
        });
    }
}
exports.LeadController = LeadController;
//# sourceMappingURL=lead.controller.js.map