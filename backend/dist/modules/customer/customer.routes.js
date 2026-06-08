"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("@/middlewares/auth.middleware");
const customer_controller_1 = require("@/modules/customer/customer.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post("/", customer_controller_1.CustomerController.create);
router.get("/", customer_controller_1.CustomerController.getAll);
router.get("/:id", customer_controller_1.CustomerController.getById);
exports.default = router;
//# sourceMappingURL=customer.routes.js.map