"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotationController = void 0;
const quotation_service_1 = require("./quotation.service");
const quotation_validation_1 = require("./quotation.validation");
class QuotationController {
    static async create(req, res) {
        const data = quotation_validation_1.createQuotationSchema.parse(req.body);
        const quotation = await quotation_service_1.QuotationService.create(req.user.id, data);
        return res.status(201).json({
            success: true,
            message: "Quotation created",
            data: quotation,
        });
    }
    static async getAll(req, res) {
        const page = Number(req.query.page || 1);
        const limit = Number(req.query.limit || 20);
        const leadId = req.query.leadId?.toString();
        const projectId = req.query.projectId?.toString();
        const customerId = req.query.customerId?.toString();
        const result = await quotation_service_1.QuotationService.getAll(page, limit, leadId, projectId, customerId);
        return res.status(200).json({
            success: true,
            data: result,
        });
    }
    static async getById(req, res) {
        const result = await quotation_service_1.QuotationService.getById(req.params.id);
        return res.status(200).json({
            success: true,
            data: result,
        });
    }
    static async getProjectQuotations(req, res) {
        const result = await quotation_service_1.QuotationService.getProjectQuotations(req.params.projectId);
        return res.status(200).json({
            success: true,
            data: result,
        });
    }
    static async updateStatus(req, res) {
        const data = quotation_validation_1.updateQuotationStatusSchema.parse(req.body);
        const result = await quotation_service_1.QuotationService.updateStatus(req.params.id, data.status, req.user.id, data.followUp);
        return res.status(200).json({
            success: true,
            message: "Quotation updated",
            data: result,
        });
    }
    static async createRevision(req, res) {
        const data = quotation_validation_1.createRevisionSchema.parse(req.body);
        const result = await quotation_service_1.QuotationService.createRevision(req.params.id, req.user.id, data.revisionReason);
        return res.status(201).json({
            success: true,
            message: "Quotation revision created",
            data: result,
        });
    }
}
exports.QuotationController = QuotationController;
//# sourceMappingURL=quotation.controller.js.map