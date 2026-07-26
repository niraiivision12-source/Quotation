import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { PurchaseOrderController } from "./purchase-order.controller";

const router = Router();

router.use(authenticate);

router.post("/", asyncHandler(PurchaseOrderController.create));
router.get("/", asyncHandler(PurchaseOrderController.getAll));
router.get("/:id", asyncHandler(PurchaseOrderController.getById));
router.put("/:id", asyncHandler(PurchaseOrderController.update));
router.delete("/:id", asyncHandler(PurchaseOrderController.delete));
router.patch("/:id/status", asyncHandler(PurchaseOrderController.updateStatus));
router.post("/:id/revision", asyncHandler(PurchaseOrderController.createRevision));
router.get("/:id/history", asyncHandler(PurchaseOrderController.getHistory));

export default router;
