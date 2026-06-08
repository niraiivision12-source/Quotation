"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("@/middlewares/auth.middleware");
const lead_controller_1 = require("@/modules/lead/lead.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post("/", lead_controller_1.LeadController.create);
router.get("/", lead_controller_1.LeadController.getAll);
router.get("/:id", lead_controller_1.LeadController.getById);
router.post("/:id/convert", lead_controller_1.LeadController.convert);
exports.default = router;
//# sourceMappingURL=lead.routes.js.map