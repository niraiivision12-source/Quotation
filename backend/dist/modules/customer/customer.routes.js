"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("@/middlewares/auth.middleware");
const async_handler_1 = require("@/utils/async-handler");
const customer_controller_1 = require("@/modules/customer/customer.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post("/", (0, async_handler_1.asyncHandler)(customer_controller_1.CustomerController.create));
router.get("/", (0, async_handler_1.asyncHandler)(customer_controller_1.CustomerController.getAll));
router.get("/:id", (0, async_handler_1.asyncHandler)(customer_controller_1.CustomerController.getById));
router.patch("/:id", (0, async_handler_1.asyncHandler)(customer_controller_1.CustomerController.update));
router.patch("/:id/deactivate", (0, async_handler_1.asyncHandler)(customer_controller_1.CustomerController.deactivate));
exports.default = router;
//# sourceMappingURL=customer.routes.js.map