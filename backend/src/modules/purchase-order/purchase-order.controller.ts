import { Request, Response } from "express";
import { PurchaseOrderService } from "./purchase-order.service";
import {
  createPurchaseOrderSchema,
  updatePurchaseOrderStatusSchema,
  createPurchaseOrderRevisionSchema,
  updatePurchaseOrderSchema,
} from "./purchase-order.validation";

export class PurchaseOrderController {
  static async create(req: Request, res: Response) {
    const userId = (req as any).user.id;
    const data = createPurchaseOrderSchema.parse(req.body);
    const po = await PurchaseOrderService.create(data, userId);

    return res.status(201).json({
      success: true,
      message: "Purchase Order created successfully",
      data: po,
    });
  }

  static async getAll(req: Request, res: Response) {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const search = req.query.search?.toString();

    const result = await PurchaseOrderService.getAll(page, limit, search);

    return res.status(200).json({
      success: true,
      message: "Purchase Orders fetched successfully",
      data: result,
    });
  }

  static async getById(req: Request, res: Response) {
    const po = await PurchaseOrderService.getById(req.params.id as string);

    return res.status(200).json({
      success: true,
      message: "Purchase Order fetched successfully",
      data: po,
    });
  }

  static async updateStatus(req: Request, res: Response) {
    const data = updatePurchaseOrderStatusSchema.parse(req.body);
    const po = await PurchaseOrderService.updateStatus(req.params.id as string, data.status);

    return res.status(200).json({
      success: true,
      message: "Purchase Order status updated successfully",
      data: po,
    });
  }

  static async createRevision(req: Request, res: Response) {
    const userId = (req as any).user.id;
    const data = createPurchaseOrderRevisionSchema.parse(req.body);
    const po = await PurchaseOrderService.createRevision(
      req.params.id as string,
      userId,
      data.revisionReason
    );

    return res.status(201).json({
      success: true,
      message: "Purchase Order revision created successfully",
      data: po,
    });
  }

  static async getHistory(req: Request, res: Response) {
    const history = await PurchaseOrderService.getHistory(req.params.id as string);

    return res.status(200).json({
      success: true,
      message: "Purchase Order history fetched successfully",
      data: history,
    });
  }

  static async update(req: Request, res: Response) {
    const data = updatePurchaseOrderSchema.parse(req.body);
    const po = await PurchaseOrderService.update(req.params.id as string, data);

    return res.status(200).json({
      success: true,
      message: "Purchase Order updated successfully",
      data: po,
    });
  }

  static async delete(req: Request, res: Response) {
    await PurchaseOrderService.delete(req.params.id as string);

    return res.status(200).json({
      success: true,
      message: "Purchase Order deleted successfully",
    });
  }
}

