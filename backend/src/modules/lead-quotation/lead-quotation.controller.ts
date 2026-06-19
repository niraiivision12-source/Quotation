import { Request, Response } from "express";

import { LeadQuotationService } from "./lead-quotation.service";

import {
  createLeadQuotationSchema,
  updateLeadQuotationStatusSchema,
} from "./lead-quotation.validation";

export class LeadQuotationController {
  static async create(req: Request, res: Response) {
    const data = createLeadQuotationSchema.parse(req.body);

    const quotation = await LeadQuotationService.create(data);

    return res.status(201).json({
      success: true,
      message: "Quotation created",
      data: quotation,
    });
  }

  static async getById(req: Request, res: Response) {
    const quotation = await LeadQuotationService.getById(
      req.params.id as string,
    );

    return res.status(200).json({
      success: true,
      message: "Quotation fetched",
      data: quotation,
    });
  }

  static async updateStatus(req: Request, res: Response) {
    const data = updateLeadQuotationStatusSchema.parse(req.body);

    const quotation = await LeadQuotationService.updateStatus(
      req.params.id as string,
      data.status,
    );

    return res.status(200).json({
      success: true,
      message: "Quotation updated",
      data: quotation,
    });
  }
}
