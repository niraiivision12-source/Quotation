import { Request, Response } from "express";
import { PaymentService } from "./payment.service";
import { createPaymentSchema, createTransactionSchema } from "./payment.validation";
import { PaymentStatus } from "@prisma/client";

export class PaymentController {
  static async linkBill(req: Request, res: Response) {
    const data = createPaymentSchema.parse(req.body);
    const userId = req.user!.id;

    const payment = await PaymentService.linkBill(userId, data);

    return res.status(201).json({
      success: true,
      message: "Bill linked and payment record created",
      data: payment,
    });
  }

  static async recordTransaction(req: Request, res: Response) {
    const paymentId = req.params.id as string;
    const data = createTransactionSchema.parse(req.body);
    const userId = req.user!.id;

    const result = await PaymentService.recordTransaction(userId, paymentId, data);

    return res.status(201).json({
      success: true,
      message: "Payment transaction recorded successfully",
      data: result,
    });
  }

  static async cancelPayment(req: Request, res: Response) {
    const paymentId = req.params.id as string;
    const userId = req.user!.id;

    const result = await PaymentService.cancelPayment(userId, paymentId);

    return res.status(200).json({
      success: true,
      message: "Payment record cancelled successfully",
      data: result,
    });
  }

  static async getAll(req: Request, res: Response) {
    const filters = {
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      search: req.query.search?.toString(),
      status: req.query.status as PaymentStatus,
      customerId: req.query.customerId?.toString(),
      projectId: req.query.projectId?.toString(),
      salesmanId: req.query.salesmanId?.toString(),
      collectorId: req.query.collectorId?.toString(),
    };

    const payments = await PaymentService.getAll(filters);

    return res.status(200).json({
      success: true,
      message: "Payments fetched successfully",
      data: payments,
    });
  }

  static async getById(req: Request, res: Response) {
    const paymentId = req.params.id as string;
    const payment = await PaymentService.getById(paymentId);

    return res.status(200).json({
      success: true,
      message: "Payment details fetched successfully",
      data: payment,
    });
  }
}
