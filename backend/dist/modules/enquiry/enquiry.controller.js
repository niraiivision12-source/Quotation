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
    static async checkMobile(req, res) {
        const mobile = req.query.mobile?.toString() || "";
        const result = await enquiry_service_1.EnquiryService.checkMobileExists(mobile);
        return res.status(200).json({
            success: true,
            message: "Mobile check completed",
            data: result,
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
        const { category, notes, projectName } = enquiry_validation_1.triageEnquirySchema.parse(req.body);
        const result = await enquiry_service_1.EnquiryService.triage(id, category, notes, projectName);
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
    // ─── New: Delete (permanent) ────────────────────────────────────────────────
    static async remove(req, res) {
        const { id } = req.params;
        await enquiry_service_1.EnquiryService.delete(id);
        return res.status(200).json({
            success: true,
            message: "Enquiry permanently deleted",
        });
    }
    // ─── New: Update (PENDING only) ─────────────────────────────────────────────
    static async update(req, res) {
        const { id } = req.params;
        const data = enquiry_validation_1.updateEnquirySchema.parse(req.body);
        const enquiry = await enquiry_service_1.EnquiryService.update(id, data);
        return res.status(200).json({
            success: true,
            message: "Enquiry updated successfully",
            data: enquiry,
        });
    }
    // ─── New: Restore IGNORED → PENDING ─────────────────────────────────────────
    static async restore(req, res) {
        const { id } = req.params;
        const enquiry = await enquiry_service_1.EnquiryService.restore(id);
        return res.status(200).json({
            success: true,
            message: "Enquiry restored to pending",
            data: enquiry,
        });
    }
    // ─── New: Bulk Delete ────────────────────────────────────────────────────────
    static async bulkDelete(req, res) {
        const { ids } = enquiry_validation_1.bulkActionSchema.parse(req.body);
        const result = await enquiry_service_1.EnquiryService.bulkDelete(ids);
        return res.status(200).json({
            success: true,
            message: `${result.deleted} enquiry/enquiries permanently deleted`,
            data: result,
        });
    }
    // ─── New: Bulk Ignore ────────────────────────────────────────────────────────
    static async bulkIgnore(req, res) {
        const { ids } = enquiry_validation_1.bulkActionSchema.parse(req.body);
        const result = await enquiry_service_1.EnquiryService.bulkIgnore(ids);
        return res.status(200).json({
            success: true,
            message: `${result.ignored} enquiry/enquiries marked as ignored`,
            data: result,
        });
    }
    // ─── New: Export CSV ─────────────────────────────────────────────────────────
    static async exportCSV(req, res) {
        const search = req.query.search?.toString();
        const status = req.query.status;
        const items = await enquiry_service_1.EnquiryService.exportAll(search, status);
        // Build CSV string
        const headers = ["ID", "Name", "Mobile", "Email", "City", "Source", "Status", "Category", "Message", "Created At"];
        const rows = items.map((e) => [
            e.id,
            `"${(e.name || "").replace(/"/g, '""')}"`,
            e.mobile,
            e.email || "",
            `"${(e.city || "").replace(/"/g, '""')}"`,
            e.source || "",
            e.status,
            e.category || "",
            `"${(e.message || "").replace(/"/g, '""').replace(/\n/g, " ")}"`,
            new Date(e.createdAt).toISOString(),
        ]);
        const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="enquiries-${new Date().toISOString().slice(0, 10)}.csv"`);
        return res.send(csv);
    }
}
exports.EnquiryController = EnquiryController;
//# sourceMappingURL=enquiry.controller.js.map