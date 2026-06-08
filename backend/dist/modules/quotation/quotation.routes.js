"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("@/middlewares/auth.middleware");
const quotation_controller_1 = require("@/modules/quotation/quotation.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post("/", quotation_controller_1.QuotationController.create);
router.get("/", quotation_controller_1.QuotationController.getAll);
router.get("/project/:projectId", quotation_controller_1.QuotationController.getProjectQuotations);
router.post("/:id/revision", quotation_controller_1.QuotationController.createRevision);
router.patch("/:id/status", quotation_controller_1.QuotationController.updateStatus);
router.get("/:id", quotation_controller_1.QuotationController.getById);
exports.default = router;
//# sourceMappingURL=quotation.routes.js.map