"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const prisma_1 = require("@/config/prisma");
class ProductService {
    static async getAll(page, limit) {
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            prisma_1.prisma.product.findMany({
                skip,
                take: limit,
                orderBy: {
                    name: "asc",
                },
            }),
            prisma_1.prisma.product.count(),
        ]);
        return {
            items,
            total,
            page,
            limit,
        };
    }
}
exports.ProductService = ProductService;
//# sourceMappingURL=product.service.js.map