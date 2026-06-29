"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("@/middlewares/auth.middleware");
const async_handler_1 = require("@/utils/async-handler");
const permission_middleware_1 = require("@/middlewares/permission.middleware");
const payment_controller_1 = require("./payment.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Link bill
router.post("/link-bill", (0, permission_middleware_1.checkPermission)("managePayments"), (0, async_handler_1.asyncHandler)(payment_controller_1.PaymentController.linkBill));
// Record a transaction against a bill
router.post("/:id/transactions", (0, permission_middleware_1.checkPermission)("managePayments"), (0, async_handler_1.asyncHandler)(payment_controller_1.PaymentController.recordTransaction));
// Cancel a payment record
router.post("/:id/cancel", (0, permission_middleware_1.checkPermission)("managePayments"), (0, async_handler_1.asyncHandler)(payment_controller_1.PaymentController.cancelPayment));
// Fetch all payments
router.get("/", (0, permission_middleware_1.checkPermission)("viewPayments"), (0, async_handler_1.asyncHandler)(payment_controller_1.PaymentController.getAll));
// Fetch payment detail
router.get("/:id", (0, permission_middleware_1.checkPermission)("viewPayments"), (0, async_handler_1.asyncHandler)(payment_controller_1.PaymentController.getById));
exports.default = router;
//# sourceMappingURL=payment.routes.js.map