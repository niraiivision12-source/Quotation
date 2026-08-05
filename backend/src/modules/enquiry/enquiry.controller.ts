import { Request, Response } from "express";
import { EnquiryService } from "./enquiry.service";
import {
  createEnquirySchema,
  triageEnquirySchema,
  updateEnquirySchema,
  bulkActionSchema,
} from "./enquiry.validation";
import { EnquiryStatus, ProductCategory } from "@prisma/client";

export class EnquiryController {
  static async create(req: Request, res: Response) {
    const data = createEnquirySchema.parse(req.body);
    const enquiry = await EnquiryService.create(data);

    return res.status(201).json({
      success: true,
      message: "Enquiry recorded in inbox",
      data: enquiry,
    });
  }

  static async checkMobile(req: Request, res: Response) {
    const mobile = req.query.mobile?.toString() || "";

    const result = await EnquiryService.checkMobileExists(mobile);

    return res.status(200).json({
      success: true,
      message: "Mobile check completed",
      data: result,
    });
  }

  static async getAll(req: Request, res: Response) {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const search = req.query.search?.toString();
    const status = req.query.status as EnquiryStatus | undefined;

    const data = await EnquiryService.getAll(page, limit, search, status);

    return res.status(200).json({
      success: true,
      message: "Enquiries fetched",
      data,
    });
  }

  static async triage(req: Request, res: Response) {
    const { id } = req.params;
    const { category, notes, projectName } = triageEnquirySchema.parse(req.body);

    const result = await EnquiryService.triage(id as string, category, notes, projectName);

    return res.status(200).json({
      success: true,
      message: "Enquiry triaged successfully",
      data: result,
    });
  }

  static async ignore(req: Request, res: Response) {
    const { id } = req.params;
    const enquiry = await EnquiryService.ignore(id as string);

    return res.status(200).json({
      success: true,
      message: "Enquiry marked ignored",
      data: enquiry,
    });
  }

  // ─── New: Delete (permanent) ────────────────────────────────────────────────
  static async remove(req: Request, res: Response) {
    const { id } = req.params;
    await EnquiryService.delete(id as string);

    return res.status(200).json({
      success: true,
      message: "Enquiry permanently deleted",
    });
  }

  // ─── New: Update (PENDING only) ─────────────────────────────────────────────
  static async update(req: Request, res: Response) {
    const { id } = req.params;
    const data = updateEnquirySchema.parse(req.body);

    const enquiry = await EnquiryService.update(id as string, data);

    return res.status(200).json({
      success: true,
      message: "Enquiry updated successfully",
      data: enquiry,
    });
  }

  // ─── New: Restore IGNORED → PENDING ─────────────────────────────────────────
  static async restore(req: Request, res: Response) {
    const { id } = req.params;
    const enquiry = await EnquiryService.restore(id as string);

    return res.status(200).json({
      success: true,
      message: "Enquiry restored to pending",
      data: enquiry,
    });
  }

  // ─── New: Bulk Delete ────────────────────────────────────────────────────────
  static async bulkDelete(req: Request, res: Response) {
    const { ids } = bulkActionSchema.parse(req.body);
    const result = await EnquiryService.bulkDelete(ids);

    return res.status(200).json({
      success: true,
      message: `${result.deleted} enquiry/enquiries permanently deleted`,
      data: result,
    });
  }

  // ─── New: Bulk Ignore ────────────────────────────────────────────────────────
  static async bulkIgnore(req: Request, res: Response) {
    const { ids } = bulkActionSchema.parse(req.body);
    const result = await EnquiryService.bulkIgnore(ids);

    return res.status(200).json({
      success: true,
      message: `${result.ignored} enquiry/enquiries marked as ignored`,
      data: result,
    });
  }

  // ─── New: Export CSV ─────────────────────────────────────────────────────────
  static async exportCSV(req: Request, res: Response) {
    const search = req.query.search?.toString();
    const status = req.query.status as EnquiryStatus | undefined;

    const items = await EnquiryService.exportAll(search, status);

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
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="enquiries-${new Date().toISOString().slice(0, 10)}.csv"`
    );

    return res.send(csv);
  }
}
