"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const auth_controller_1 = require("./auth.controller");
const async_handler_1 = require("../../utils/async-handler");
const router = (0, express_1.Router)();
router.post("/login", (0, async_handler_1.asyncHandler)(auth_controller_1.AuthController.login));
router.get("/me", auth_middleware_1.authenticate, (0, role_middleware_1.authorize)(client_1.UserRole.OWNER, client_1.UserRole.SALESMAN, client_1.UserRole.ATTENDANT, client_1.UserRole.ACCOUNTANT), (0, async_handler_1.asyncHandler)(auth_controller_1.AuthController.me));
exports.default = router;
//# sourceMappingURL=auth.routes.js.map