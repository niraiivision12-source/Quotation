"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const async_handler_1 = require("../../utils/async-handler");
const dashboard_controller_1 = require("./dashboard.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get("/summary", (0, async_handler_1.asyncHandler)(dashboard_controller_1.DashboardController.getSummary));
router.get("/", (0, async_handler_1.asyncHandler)(dashboard_controller_1.DashboardController.getSummary));
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map