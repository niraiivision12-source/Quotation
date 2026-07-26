"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const async_handler_1 = require("../../utils/async-handler");
const purchase_order_controller_1 = require("./purchase-order.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post("/", (0, async_handler_1.asyncHandler)(purchase_order_controller_1.PurchaseOrderController.create));
router.get("/", (0, async_handler_1.asyncHandler)(purchase_order_controller_1.PurchaseOrderController.getAll));
router.get("/:id", (0, async_handler_1.asyncHandler)(purchase_order_controller_1.PurchaseOrderController.getById));
router.put("/:id", (0, async_handler_1.asyncHandler)(purchase_order_controller_1.PurchaseOrderController.update));
router.delete("/:id", (0, async_handler_1.asyncHandler)(purchase_order_controller_1.PurchaseOrderController.delete));
router.patch("/:id/status", (0, async_handler_1.asyncHandler)(purchase_order_controller_1.PurchaseOrderController.updateStatus));
router.post("/:id/revision", (0, async_handler_1.asyncHandler)(purchase_order_controller_1.PurchaseOrderController.createRevision));
router.get("/:id/history", (0, async_handler_1.asyncHandler)(purchase_order_controller_1.PurchaseOrderController.getHistory));
exports.default = router;
//# sourceMappingURL=purchase-order.routes.js.map