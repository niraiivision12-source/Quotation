import { Request, Response } from "express";

import { ProductService } from "@/modules/product/product.service";

export class ProductController {
  static async getAll(req: Request, res: Response) {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);

    const products = await ProductService.getAll(page, limit);

    return res.status(200).json({
      success: true,
      message: "Products fetched",
      data: products,
    });
  }
}
