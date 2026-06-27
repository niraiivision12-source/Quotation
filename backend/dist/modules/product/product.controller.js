"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const product_service_1 = require("@/modules/product/product.service");
const product_validation_1 = require("@/modules/product/product.validation");
class ProductController {
    static async create(req, res) {
        const data = product_validation_1.createProductSchema.parse(req.body);
        const product = await product_service_1.ProductService.create(data);
        return res.status(201).json({
            success: true,
            message: "Product created",
            data: product,
        });
    }
    static async getAll(req, res) {
        const page = Number(req.query.page || 1);
        const limit = Number(req.query.limit || 20);
        const search = req.query.search?.toString();
        const products = await product_service_1.ProductService.getAll(page, limit, search);
        return res.status(200).json({
            success: true,
            message: "Products fetched",
            data: products,
        });
    }
    static async getById(req, res) {
        const product = await product_service_1.ProductService.getById(req.params.id);
        return res.status(200).json({
            success: true,
            message: "Product fetched",
            data: product,
        });
    }
    static async update(req, res) {
        const data = product_validation_1.updateProductSchema.parse(req.body);
        const product = await product_service_1.ProductService.update(req.params.id, data);
        return res.status(200).json({
            success: true,
            message: "Product updated",
            data: product,
        });
    }
    static async deactivate(req, res) {
        const product = await product_service_1.ProductService.deactivate(req.params.id);
        return res.status(200).json({
            success: true,
            message: "Product deactivated",
            data: product,
        });
    }
    static async sync(_req, res) {
        return res.status(200).json({
            success: true,
            message: "Product sync not implemented yet",
        });
    }
}
exports.ProductController = ProductController;
//# sourceMappingURL=product.controller.js.map