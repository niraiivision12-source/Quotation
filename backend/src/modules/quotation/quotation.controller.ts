import { Request, Response } from "express";

import { QuotationService } from "@/modules/quotation/quotation.service";

import { createQuotationSchema } from "@/modules/quotation/quotation.validation";

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
}
