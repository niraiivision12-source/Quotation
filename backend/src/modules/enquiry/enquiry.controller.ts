import { Request, Response } from "express";
import { EnquiryService } from "./enquiry.service";
import { createEnquirySchema, triageEnquirySchema } from "./enquiry.validation";
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
    const { category, notes } = triageEnquirySchema.parse(req.body);

    const result = await EnquiryService.triage(id as string, category, notes);

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
}
