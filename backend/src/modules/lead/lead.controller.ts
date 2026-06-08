import { Request, Response } from "express";

import { LeadService } from "@/modules/lead/lead.service";
import { createLeadSchema } from "@/modules/lead/lead.validation";

type LeadParams = {
  id: string;
};

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

  static async getAll(req: Request, res: Response) {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);

    const search = req.query.search?.toString();

    const leads = await LeadService.getAll(page, limit, search);

    return res.status(200).json({
      success: true,
      message: "Leads fetched",
      data: leads,
    });
  }

  static async getById(req: Request<LeadParams>, res: Response) {
    const lead = await LeadService.getById(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Lead fetched",
      data: lead,
    });
  }
}
