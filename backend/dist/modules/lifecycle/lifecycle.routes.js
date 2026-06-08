"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("@/middlewares/auth.middleware");
const lifecycle_controller_1 = require("@/modules/lifecycle/lifecycle.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get("/project/:projectId", lifecycle_controller_1.LifecycleController.getProjectLifecycle);
router.patch("/:id", lifecycle_controller_1.LifecycleController.updatePhase);
exports.default = router;
//# sourceMappingURL=lifecycle.routes.js.map