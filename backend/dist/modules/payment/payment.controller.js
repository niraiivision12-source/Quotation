"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const payment_service_1 = require("./payment.service");
const payment_validation_1 = require("./payment.validation");
class PaymentController {
    static async linkBill(req, res) {
        const data = payment_validation_1.createPaymentSchema.parse(req.body);
        const userId = req.user.id;
        const payment = await payment_service_1.PaymentService.linkBill(userId, data);
        return res.status(201).json({
            success: true,
            message: "Bill linked and payment record created",
            data: payment,
        });
    }
    static async recordTransaction(req, res) {
        const paymentId = req.params.id;
        const data = payment_validation_1.createTransactionSchema.parse(req.body);
        const userId = req.user.id;
        const result = await payment_service_1.PaymentService.recordTransaction(userId, paymentId, data);
        return res.status(201).json({
            success: true,
            message: "Payment transaction recorded successfully",
            data: result,
        });
    }
    static async cancelPayment(req, res) {
        const paymentId = req.params.id;
        const userId = req.user.id;
        const result = await payment_service_1.PaymentService.cancelPayment(userId, paymentId);
        return res.status(200).json({
            success: true,
            message: "Payment record cancelled successfully",
            data: result,
        });
    }
    static async getAll(req, res) {
        const filters = {
            page: req.query.page ? Number(req.query.page) : undefined,
            limit: req.query.limit ? Number(req.query.limit) : undefined,
            search: req.query.search?.toString(),
            status: req.query.status,
            customerId: req.query.customerId?.toString(),
            opportunityId: req.query.opportunityId?.toString(),
            salesmanId: req.query.salesmanId?.toString(),
            collectorId: req.query.collectorId?.toString(),
        };
        const payments = await payment_service_1.PaymentService.getAll(filters);
        return res.status(200).json({
            success: true,
            message: "Payments fetched successfully",
            data: payments,
        });
    }
    static async getById(req, res) {
        const paymentId = req.params.id;
        const payment = await payment_service_1.PaymentService.getById(paymentId);
        return res.status(200).json({
            success: true,
            message: "Payment details fetched successfully",
            data: payment,
        });
    }
}
exports.PaymentController = PaymentController;
//# sourceMappingURL=payment.controller.js.map