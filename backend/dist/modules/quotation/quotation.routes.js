"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("@/middlewares/auth.middleware");
const async_handler_1 = require("@/utils/async-handler");
const quotation_controller_1 = require("@/modules/quotation/quotation.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post("/", (0, async_handler_1.asyncHandler)(quotation_controller_1.QuotationController.create));
router.get("/", (0, async_handler_1.asyncHandler)(quotation_controller_1.QuotationController.getAll));
router.get("/project/:projectId", (0, async_handler_1.asyncHandler)(quotation_controller_1.QuotationController.getProjectQuotations));
router.post("/:id/revision", (0, async_handler_1.asyncHandler)(quotation_controller_1.QuotationController.createRevision));
router.patch("/:id/status", (0, async_handler_1.asyncHandler)(quotation_controller_1.QuotationController.updateStatus));
router.get("/:id", (0, async_handler_1.asyncHandler)(quotation_controller_1.QuotationController.getById));
exports.default = router;
//# sourceMappingURL=quotation.routes.js.map