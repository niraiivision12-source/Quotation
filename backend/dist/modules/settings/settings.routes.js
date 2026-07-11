"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const async_handler_1 = require("../../utils/async-handler");
const settings_controller_1 = require("./settings.controller");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get("/", (0, async_handler_1.asyncHandler)(settings_controller_1.SettingsController.get));
router.put("/", (0, role_middleware_1.authorize)(client_1.UserRole.OWNER), (0, async_handler_1.asyncHandler)(settings_controller_1.SettingsController.update));
router.get("/export", (0, role_middleware_1.authorize)(client_1.UserRole.OWNER), (0, async_handler_1.asyncHandler)(settings_controller_1.SettingsController.export));
router.post("/import", (0, role_middleware_1.authorize)(client_1.UserRole.OWNER), (0, async_handler_1.asyncHandler)(settings_controller_1.SettingsController.import));
exports.default = router;
//# sourceMappingURL=settings.routes.js.map