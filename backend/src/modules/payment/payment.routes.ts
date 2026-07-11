import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { checkPermission } from "../../middlewares/permission.middleware";
import { PaymentController } from "./payment.controller";

const router = Router();

router.use(authenticate);

// Link bill
router.post("/link-bill", checkPermission("managePayments"), asyncHandler(PaymentController.linkBill));

// Record a transaction against a bill
router.post("/:id/transactions", checkPermission("managePayments"), asyncHandler(PaymentController.recordTransaction));

// Cancel a payment record
router.post("/:id/cancel", checkPermission("managePayments"), asyncHandler(PaymentController.cancelPayment));

// Fetch all payments
router.get("/", checkPermission("viewPayments"), asyncHandler(PaymentController.getAll));

// Fetch payment detail
router.get("/:id", checkPermission("viewPayments"), asyncHandler(PaymentController.getById));

export default router;
