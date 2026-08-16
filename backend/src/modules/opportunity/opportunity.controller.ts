import { Request, Response } from "express";
import { OpportunityService } from "./opportunity.service";
import { updateOpportunitySchema } from "./opportunity.validation";
import { OpportunityStatus, ProductCategory } from "@prisma/client";

export class OpportunityController {
  static async getAll(req: Request, res: Response) {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const search = req.query.search?.toString();

    const filters = {
      category: req.query.category as ProductCategory | undefined,
      status: req.query.status as OpportunityStatus | undefined,
    };

    const data = await OpportunityService.getAll(
      req.user!.id,
      req.user!.role,
      page,
      limit,
      search,
      filters
    );

    return res.status(200).json({
      success: true,
      message: "Opportunities fetched",
      data,
    });
  }

  static async getById(req: Request, res: Response) {
    const { id } = req.params;
    const opportunity = await OpportunityService.getById(
      id as string,
      req.user!.id,
      req.user!.role
    );

    return res.status(200).json({
      success: true,
      message: "Opportunity fetched",
      data: opportunity,
    });
  }

  static async update(req: Request, res: Response) {
    const { id } = req.params;
    const data = updateOpportunitySchema.parse(req.body);

    const opportunity = await OpportunityService.update(
      id as string,
      req.user!.id,
      req.user!.role,
      data
    );

    return res.status(200).json({
      success: true,
      message: "Opportunity updated",
      data: opportunity,
    });
  }

  static async getCounts(req: Request, res: Response) {
    const category = req.query.category as ProductCategory | undefined;
    const search = req.query.search?.toString();

    const counts = await OpportunityService.getStatusCounts(category, search);

    return res.status(200).json({
      success: true,
      message: "Opportunity status counts fetched",
      data: counts,
    });
  }

  static async getStats(req: Request, res: Response) {
    const stats = await OpportunityService.getStats(
      req.user!.id,
      req.user!.role
    );

    return res.status(200).json({
      success: true,
      message: "Opportunity stats fetched",
      data: stats,
    });
  }

  static async remove(req: Request, res: Response) {
    const { id } = req.params;
    await OpportunityService.delete(id as string);
    return res.status(200).json({
      success: true,
      message: "Opportunity deleted successfully",
    });
  }
}
