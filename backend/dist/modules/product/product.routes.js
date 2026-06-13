"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("@/middlewares/auth.middleware");
const async_handler_1 = require("@/utils/async-handler");
const product_controller_1 = require("@/modules/product/product.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post("/", (0, async_handler_1.asyncHandler)(product_controller_1.ProductController.create));
router.get("/", (0, async_handler_1.asyncHandler)(product_controller_1.ProductController.getAll));
router.get("/:id", (0, async_handler_1.asyncHandler)(product_controller_1.ProductController.getById));
router.patch("/:id", (0, async_handler_1.asyncHandler)(product_controller_1.ProductController.update));
router.patch("/:id/deactivate", (0, async_handler_1.asyncHandler)(product_controller_1.ProductController.deactivate));
router.post("/sync", (0, async_handler_1.asyncHandler)(product_controller_1.ProductController.sync));
exports.default = router;
//# sourceMappingURL=product.routes.js.map