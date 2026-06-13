import { Router } from "express";

import { authenticate } from "@/middlewares/auth.middleware";
import { asyncHandler } from "@/utils/async-handler";

import { ProjectController } from "@/modules/project/project.controller";

const router = Router();

router.use(authenticate);

router.post("/", asyncHandler(ProjectController.create));

router.get("/", asyncHandler(ProjectController.getAll));

router.get("/:id", asyncHandler(ProjectController.getById));

router.patch("/:id", asyncHandler(ProjectController.update));

router.patch("/:id/deactivate", asyncHandler(ProjectController.deactivate));

export default router;
