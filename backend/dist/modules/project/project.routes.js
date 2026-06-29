"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("@/middlewares/auth.middleware");
const permission_middleware_1 = require("@/middlewares/permission.middleware");
const async_handler_1 = require("@/utils/async-handler");
const project_controller_1 = require("@/modules/project/project.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post("/", (0, async_handler_1.asyncHandler)(project_controller_1.ProjectController.create));
router.get("/", (0, async_handler_1.asyncHandler)(project_controller_1.ProjectController.getAll));
router.get("/:id", (0, async_handler_1.asyncHandler)(project_controller_1.ProjectController.getById));
router.patch("/:id", (0, permission_middleware_1.checkPermission)("editProjects"), (0, async_handler_1.asyncHandler)(project_controller_1.ProjectController.update));
router.patch("/:id/phase", (0, permission_middleware_1.checkPermission)("editProjects"), (0, async_handler_1.asyncHandler)(project_controller_1.ProjectController.updatePhase));
router.patch("/:id/deactivate", (0, permission_middleware_1.checkPermission)("editProjects"), (0, async_handler_1.asyncHandler)(project_controller_1.ProjectController.deactivate));
exports.default = router;
//# sourceMappingURL=project.routes.js.map