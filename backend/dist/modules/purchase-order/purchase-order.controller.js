"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseOrderController = void 0;
const purchase_order_service_1 = require("./purchase-order.service");
const purchase_order_validation_1 = require("./purchase-order.validation");
class PurchaseOrderController {
    static async create(req, res) {
        const userId = req.user.id;
        const data = purchase_order_validation_1.createPurchaseOrderSchema.parse(req.body);
        const po = await purchase_order_service_1.PurchaseOrderService.create(data, userId);
        return res.status(201).json({
            success: true,
            message: "Purchase Order created successfully",
            data: po,
        });
    }
    static async getAll(req, res) {
        const page = Number(req.query.page || 1);
        const limit = Number(req.query.limit || 20);
        const search = req.query.search?.toString();
        const result = await purchase_order_service_1.PurchaseOrderService.getAll(page, limit, search);
        return res.status(200).json({
            success: true,
            message: "Purchase Orders fetched successfully",
            data: result,
        });
    }
    static async getById(req, res) {
        const po = await purchase_order_service_1.PurchaseOrderService.getById(req.params.id);
        return res.status(200).json({
            success: true,
            message: "Purchase Order fetched successfully",
            data: po,
        });
    }
    static async updateStatus(req, res) {
        const data = purchase_order_validation_1.updatePurchaseOrderStatusSchema.parse(req.body);
        const po = await purchase_order_service_1.PurchaseOrderService.updateStatus(req.params.id, data.status);
        return res.status(200).json({
            success: true,
            message: "Purchase Order status updated successfully",
            data: po,
        });
    }
    static async createRevision(req, res) {
        const userId = req.user.id;
        const data = purchase_order_validation_1.createPurchaseOrderRevisionSchema.parse(req.body);
        const po = await purchase_order_service_1.PurchaseOrderService.createRevision(req.params.id, userId, data.revisionReason);
        return res.status(201).json({
            success: true,
            message: "Purchase Order revision created successfully",
            data: po,
        });
    }
    static async getHistory(req, res) {
        const history = await purchase_order_service_1.PurchaseOrderService.getHistory(req.params.id);
        return res.status(200).json({
            success: true,
            message: "Purchase Order history fetched successfully",
            data: history,
        });
    }
    static async update(req, res) {
        const data = purchase_order_validation_1.updatePurchaseOrderSchema.parse(req.body);
        const po = await purchase_order_service_1.PurchaseOrderService.update(req.params.id, data);
        return res.status(200).json({
            success: true,
            message: "Purchase Order updated successfully",
            data: po,
        });
    }
    static async delete(req, res) {
        await purchase_order_service_1.PurchaseOrderService.delete(req.params.id);
        return res.status(200).json({
            success: true,
            message: "Purchase Order deleted successfully",
        });
    }
}
exports.PurchaseOrderController = PurchaseOrderController;
//# sourceMappingURL=purchase-order.controller.js.map