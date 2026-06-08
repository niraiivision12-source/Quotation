import { Request, Response } from "express";

import { QuotationService } from "@/modules/quotation/quotation.service";

import {
  createQuotationSchema,
  updateQuotationStatusSchema,
} from "@/modules/quotation/quotation.validation";

type QuotationParams = {
  id: string;
  projectId: string;
};

export class QuotationController {
  static async create(req: Request, res: Response) {
    const data = createQuotationSchema.parse(req.body);

    const quotation = await QuotationService.create(req.user!.id, data);

    return res.status(201).json({
      success: true,
      message: "Quotation created",
      data: quotation,
    });
  }

  static async getAll(req: Request, res: Response) {
    const page = Number(req.query.page || 1);

    const limit = Number(req.query.limit || 20);

    const projectId = req.query.projectId?.toString();

    const customerId = req.query.customerId?.toString();

    const result = await QuotationService.getAll(
      page,
      limit,
      projectId,
      customerId,
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  }

  static async getById(req: Request<QuotationParams>, res: Response) {
    const result = await QuotationService.getById(req.params.id);

    return res.status(200).json({
      success: true,
      data: result,
    });
  }

  static async getProjectQuotations(
    req: Request<QuotationParams>,
    res: Response,
  ) {
    const result = await QuotationService.getProjectQuotations(
      req.params.projectId,
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  }

  static async updateStatus(req: Request<QuotationParams>, res: Response) {
    const data = updateQuotationStatusSchema.parse(req.body);

    const result = await QuotationService.updateStatus(
      req.params.id,
      data.status,
    );

    return res.status(200).json({
      success: true,
      message: "Quotation updated",
      data: result,
    });
  }
}
