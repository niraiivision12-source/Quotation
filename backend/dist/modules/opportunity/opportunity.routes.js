"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const async_handler_1 = require("../../utils/async-handler");
const opportunity_controller_1 = require("./opportunity.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get("/", (0, async_handler_1.asyncHandler)(opportunity_controller_1.OpportunityController.getAll));
router.get("/stats", (0, async_handler_1.asyncHandler)(opportunity_controller_1.OpportunityController.getStats));
router.get("/counts", (0, async_handler_1.asyncHandler)(opportunity_controller_1.OpportunityController.getCounts));
router.get("/:id", (0, async_handler_1.asyncHandler)(opportunity_controller_1.OpportunityController.getById));
router.patch("/:id", (0, async_handler_1.asyncHandler)(opportunity_controller_1.OpportunityController.update));
exports.default = router;
//# sourceMappingURL=opportunity.routes.js.map