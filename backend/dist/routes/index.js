"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("@/modules/auth/auth.routes"));
const customer_routes_1 = __importDefault(require("@/modules/customer/customer.routes"));
const dashboard_routes_1 = __importDefault(require("@/modules/dashboard/dashboard.routes"));
const lead_routes_1 = __importDefault(require("@/modules/lead/lead.routes"));
const lifecycle_routes_1 = __importDefault(require("@/modules/lifecycle/lifecycle.routes"));
const product_routes_1 = __importDefault(require("@/modules/product/product.routes"));
const project_routes_1 = __importDefault(require("@/modules/project/project.routes"));
const quotation_routes_1 = __importDefault(require("@/modules/quotation/quotation.routes"));
const reminder_routes_1 = __importDefault(require("@/modules/reminder/reminder.routes"));
const task_routes_1 = __importDefault(require("@/modules/task/task.routes"));
const user_routes_1 = __importDefault(require("@/modules/user/user.routes"));
const settings_routes_1 = __importDefault(require("@/modules/settings/settings.routes"));
const payment_routes_1 = __importDefault(require("@/modules/payment/payment.routes"));
const router = (0, express_1.Router)();
router.get("/health", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "API Running",
    });
});
router.use("/auth", auth_routes_1.default);
router.use("/users", user_routes_1.default);
router.use("/products", product_routes_1.default);
router.use("/customers", customer_routes_1.default);
router.use("/projects", project_routes_1.default);
router.use("/leads", lead_routes_1.default);
router.use("/reminders", reminder_routes_1.default);
router.use("/tasks", task_routes_1.default);
router.use("/quotations", quotation_routes_1.default);
router.use("/lifecycle", lifecycle_routes_1.default);
router.use("/dashboard", dashboard_routes_1.default);
router.use("/settings", settings_routes_1.default);
router.use("/payments", payment_routes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map