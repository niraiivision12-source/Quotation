"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("@/middlewares/auth.middleware");
const async_handler_1 = require("@/utils/async-handler");
const lead_controller_1 = require("@/modules/lead/lead.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post("/", (0, async_handler_1.asyncHandler)(lead_controller_1.LeadController.create));
router.get("/", (0, async_handler_1.asyncHandler)(lead_controller_1.LeadController.getAll));
router.get("/:id", (0, async_handler_1.asyncHandler)(lead_controller_1.LeadController.getById));
router.post("/:id/convert", (0, async_handler_1.asyncHandler)(lead_controller_1.LeadController.convert));
exports.default = router;
//# sourceMappingURL=lead.routes.js.map