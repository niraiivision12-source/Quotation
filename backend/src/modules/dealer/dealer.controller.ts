import { Request, Response } from "express";
import { DealerService } from "./dealer.service";
import { createDealerSchema, updateDealerSchema } from "./dealer.validation";

export class DealerController {
  static async create(req: Request, res: Response) {
    const data = createDealerSchema.parse(req.body);
    const dealer = await DealerService.create(data);

    return res.status(201).json({
      success: true,
      message: "Dealer created successfully",
      data: dealer,
    });
  }

  static async getAll(req: Request, res: Response) {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const search = req.query.search?.toString();

    const result = await DealerService.getAll(page, limit, search);

    return res.status(200).json({
      success: true,
      message: "Dealers fetched successfully",
      data: result,
    });
  }

  static async getById(req: Request, res: Response) {
    const dealer = await DealerService.getById(req.params.id as string);

    return res.status(200).json({
      success: true,
      message: "Dealer fetched successfully",
      data: dealer,
    });
  }

  static async update(req: Request, res: Response) {
    const data = updateDealerSchema.parse(req.body);
    const dealer = await DealerService.update(req.params.id as string, data);

    return res.status(200).json({
      success: true,
      message: "Dealer updated successfully",
      data: dealer,
    });
  }

  static async deactivate(req: Request, res: Response) {
    const dealer = await DealerService.deactivate(req.params.id as string);

    return res.status(200).json({
      success: true,
      message: "Dealer deactivated successfully",
      data: dealer,
    });
  }
}
