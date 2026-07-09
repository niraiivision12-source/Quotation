"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("@/middlewares/auth.middleware");
const async_handler_1 = require("@/utils/async-handler");
const task_controller_1 = require("@/modules/task/task.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post("/", (0, async_handler_1.asyncHandler)(task_controller_1.TaskController.create));
router.get("/", (0, async_handler_1.asyncHandler)(task_controller_1.TaskController.getAll));
router.get("/:id", (0, async_handler_1.asyncHandler)(task_controller_1.TaskController.getById));
router.patch("/:id", (0, async_handler_1.asyncHandler)(task_controller_1.TaskController.update));
router.patch("/:id/complete", (0, async_handler_1.asyncHandler)(task_controller_1.TaskController.complete));
router.patch("/:id/cancel", (0, async_handler_1.asyncHandler)(task_controller_1.TaskController.cancel));
router.delete("/:id", (0, async_handler_1.asyncHandler)(task_controller_1.TaskController.remove));
exports.default = router;
//# sourceMappingURL=task.routes.js.map