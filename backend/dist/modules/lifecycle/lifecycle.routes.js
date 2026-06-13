"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("@/middlewares/auth.middleware");
const async_handler_1 = require("@/utils/async-handler");
const lifecycle_controller_1 = require("@/modules/lifecycle/lifecycle.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get("/project/:projectId", (0, async_handler_1.asyncHandler)(lifecycle_controller_1.LifecycleController.getProjectLifecycle));
router.patch("/:id", (0, async_handler_1.asyncHandler)(lifecycle_controller_1.LifecycleController.updatePhase));
exports.default = router;
//# sourceMappingURL=lifecycle.routes.js.map