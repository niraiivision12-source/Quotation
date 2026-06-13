"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = require("express");
const auth_middleware_1 = require("@/middlewares/auth.middleware");
const role_middleware_1 = require("@/middlewares/role.middleware");
const user_controller_1 = require("@/modules/user/user.controller");
const async_handler_1 = require("@/utils/async-handler");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post("/", (0, role_middleware_1.authorize)(client_1.UserRole.OWNER), (0, async_handler_1.asyncHandler)(user_controller_1.UserController.create));
router.get("/", (0, role_middleware_1.authorize)(client_1.UserRole.OWNER), (0, async_handler_1.asyncHandler)(user_controller_1.UserController.getAll));
router.get("/:id", (0, role_middleware_1.authorize)(client_1.UserRole.OWNER), (0, async_handler_1.asyncHandler)(user_controller_1.UserController.getById));
router.patch("/:id", (0, role_middleware_1.authorize)(client_1.UserRole.OWNER), (0, async_handler_1.asyncHandler)(user_controller_1.UserController.update));
router.patch("/:id/deactivate", (0, role_middleware_1.authorize)(client_1.UserRole.OWNER), (0, async_handler_1.asyncHandler)(user_controller_1.UserController.deactivate));
exports.default = router;
//# sourceMappingURL=user.routes.js.map