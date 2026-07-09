import { Router } from "express";

import { authenticate } from "@/middlewares/auth.middleware";

import { asyncHandler } from "@/utils/async-handler";

import { TaskController } from "@/modules/task/task.controller";

const router = Router();

router.use(authenticate);

router.post("/", asyncHandler(TaskController.create));

router.get("/", asyncHandler(TaskController.getAll));

router.get("/:id", asyncHandler(TaskController.getById));

router.patch("/:id", asyncHandler(TaskController.update));

router.patch("/:id/complete", asyncHandler(TaskController.complete));

router.patch("/:id/cancel", asyncHandler(TaskController.cancel));

router.delete("/:id", asyncHandler(TaskController.remove));

export default router;
