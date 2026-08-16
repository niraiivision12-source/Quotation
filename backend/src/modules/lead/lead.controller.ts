import { Request, Response } from "express";

import { LeadService } from "./lead.service";
import {
  convertLeadSchema,
  createLeadSchema,
  updateLeadSchema,
} from "./lead.validation";

export class LeadController {
  static async create(req: Request, res: Response) {
    const data = createLeadSchema.parse(req.body);

    const lead = await LeadService.create(data);

    return res.status(201).json({
      success: true,
      message: "Lead created",
      data: lead,
    });
  }

  static async checkMobile(req: Request, res: Response) {
    const mobile = req.query.mobile?.toString() || "";

    const result = await LeadService.checkMobileExists(mobile);

    return res.status(200).json({
      success: true,
      message: "Mobile check completed",
      data: result,
    });
  }

  static async getStats(_req: Request, res: Response) {
    const stats = await LeadService.getStats();
    return res.status(200).json({ success: true, data: stats });
  }

  static async getAll(req: Request, res: Response) {
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

    const leads = await LeadService.getAll(page, limit, search, filters);

    return res.status(200).json({
      success: true,
      message: "Leads fetched",
      data: leads,
    });
  }

  static async getById(req: Request, res: Response) {
    const lead = await LeadService.getById(req.params.id as string);

    return res.status(200).json({
      success: true,
      message: "Lead fetched",
      data: lead,
    });
  }

  static async convert(req: Request, res: Response) {
    const data = convertLeadSchema.parse(req.body);

    const result = await LeadService.convert(req.params.id as string, data);

    return res.status(200).json({
      success: true,
      message: "Lead converted successfully",
      data: result,
    });
  }

  static async update(req: Request, res: Response) {
    const data = updateLeadSchema.parse(req.body);

    const lead = await LeadService.update(
      req.params.id as string,
      req.user!.id,
      data,
    );

    return res.status(200).json({
      success: true,
      message: "Lead updated",
      data: lead,
    });
  }

  static async deactivate(req: Request, res: Response) {
    const lead = await LeadService.deactivate(req.params.id as string);

    return res.status(200).json({
      success: true,
      message: "Lead deactivated",
      data: lead,
    });
  }
  static async getProjects(req: Request, res: Response) {
    const result = await LeadService.getProjects(req.params.id as string);

    return res.status(200).json({
      success: true,
      message: "Lead projects fetched",
      data: result,
    });
  }

  static async remove(req: Request, res: Response) {
    const { id } = req.params;
    await LeadService.delete(id as string);
    return res.status(200).json({
      success: true,
      message: "Lead deleted successfully",
    });
  }
}
