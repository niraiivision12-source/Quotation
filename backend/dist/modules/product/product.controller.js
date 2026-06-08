"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const product_service_1 = require("@/modules/product/product.service");
class ProductController {
    static async getAll(req, res) {
        const page = Number(req.query.page || 1);
        const limit = Number(req.query.limit || 20);
        const products = await product_service_1.ProductService.getAll(page, limit);
        return res.status(200).json({
            success: true,
            message: "Products fetched",
            data: products,
        });
    }
}
exports.ProductController = ProductController;
//# sourceMappingURL=product.controller.js.map