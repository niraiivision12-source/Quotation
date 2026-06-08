import { Request, Response } from "express";

import { CustomerService } from "@/modules/customer/customer.service";
import { createCustomerSchema } from "@/modules/customer/customer.validation";

export class CustomerController {
  static async create(req: Request, res: Response) {
    const data = createCustomerSchema.parse(req.body);

    const customer = await CustomerService.create(data);

    return res.status(201).json({
      success: true,
      message: "Customer created",
      data: customer,
    });
  }

  static async getAll(req: Request, res: Response) {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);

    const customers = await CustomerService.getAll(page, limit);

    return res.status(200).json({
      success: true,
      message: "Customers fetched",
      data: customers,
    });
  }
}
