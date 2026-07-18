import { Request, Response } from "express";

import { ProductService } from "./product.service";
import { ProductImportService } from "./product.import.service";
import { AppError } from "../../utils/app-error";

import {
  createProductSchema,
  updateProductSchema,
} from "./product.validation";

export class ProductController {
  static async create(req: Request, res: Response) {
    const data = createProductSchema.parse(req.body);

    const product = await ProductService.create(data);

    return res.status(201).json({
      success: true,
      message: "Product created",
      data: product,
    });
  }

  static async getAll(req: Request, res: Response) {
    const page = Number(req.query.page || 1);

    const limit = Number(req.query.limit || 20);

    const search = req.query.search?.toString();
    const stockStatus = req.query.stockStatus?.toString();
    const priceStatus = req.query.priceStatus?.toString();

    const products = await ProductService.getAll(page, limit, search, stockStatus, priceStatus);

    return res.status(200).json({
      success: true,
      message: "Products fetched",
      data: products,
    });
  }

  static async getById(req: Request, res: Response) {
    const product = await ProductService.getById(req.params.id as string);

    return res.status(200).json({
      success: true,
      message: "Product fetched",
      data: product,
    });
  }

  static async update(req: Request, res: Response) {
    const data = updateProductSchema.parse(req.body);

    const product = await ProductService.update(req.params.id as string, data);

    return res.status(200).json({
      success: true,
      message: "Product updated",
      data: product,
    });
  }

  static async deactivate(req: Request, res: Response) {
    const product = await ProductService.deactivate(req.params.id as string);

    return res.status(200).json({
      success: true,
      message: "Product deactivated",
      data: product,
    });
  }

  static async sync(_req: Request, res: Response) {
    return res.status(200).json({
      success: true,
      message: "Product sync not implemented yet",
    });
  }

  static async previewImport(req: Request, res: Response) {
    if (!req.file) {
      throw new AppError("No file uploaded", 400);
    }
    const preview = await ProductImportService.parseAndPreview(req.file.buffer);
    return res.status(200).json({
      success: true,
      message: "Import preview generated",
      data: preview,
    });
  }

  static async confirmImport(req: Request, res: Response) {
    const { inserts, updates } = req.body;
    if (!Array.isArray(inserts) || !Array.isArray(updates)) {
      throw new AppError("Invalid import confirmation data", 400);
    }
    const result = await ProductImportService.executeImport(inserts, updates);
    return res.status(200).json({
      success: true,
      message: "Products imported successfully",
      data: result,
    });
  }
}

