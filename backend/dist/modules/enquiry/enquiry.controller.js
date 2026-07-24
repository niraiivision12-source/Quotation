"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnquiryController = void 0;
const enquiry_service_1 = require("./enquiry.service");
const enquiry_validation_1 = require("./enquiry.validation");
class EnquiryController {
    static async create(req, res) {
        const data = enquiry_validation_1.createEnquirySchema.parse(req.body);
        const enquiry = await enquiry_service_1.EnquiryService.create(data);
        return res.status(201).json({
            success: true,
            message: "Enquiry recorded in inbox",
            data: enquiry,
        });
    }
    static async getAll(req, res) {
        const page = Number(req.query.page || 1);
        const limit = Number(req.query.limit || 20);
        const search = req.query.search?.toString();
        const status = req.query.status;
        const data = await enquiry_service_1.EnquiryService.getAll(page, limit, search, status);
        return res.status(200).json({
            success: true,
            message: "Enquiries fetched",
            data,
        });
    }
    static async triage(req, res) {
        const { id } = req.params;
        const { category } = enquiry_validation_1.triageEnquirySchema.parse(req.body);
        const result = await enquiry_service_1.EnquiryService.triage(id, category);
        return res.status(200).json({
            success: true,
            message: "Enquiry triaged successfully",
            data: result,
        });
    }
    static async ignore(req, res) {
        const { id } = req.params;
        const enquiry = await enquiry_service_1.EnquiryService.ignore(id);
        return res.status(200).json({
            success: true,
            message: "Enquiry marked ignored",
            data: enquiry,
        });
    }
}
exports.EnquiryController = EnquiryController;
//# sourceMappingURL=enquiry.controller.js.map