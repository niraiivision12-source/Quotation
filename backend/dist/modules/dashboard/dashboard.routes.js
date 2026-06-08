"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("@/middlewares/auth.middleware");
const dashboard_controller_1 = require("@/modules/dashboard/dashboard.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get("/summary", dashboard_controller_1.DashboardController.getSummary);
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map