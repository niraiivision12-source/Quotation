import { Router } from "express";

import { authenticate } from "@/middlewares/auth.middleware";
import { asyncHandler } from "@/utils/async-handler";

import { LifecycleController } from "@/modules/lifecycle/lifecycle.controller";

const router = Router();

router.use(authenticate);

router.get(
  "/project/:projectId",
  asyncHandler(LifecycleController.getProjectLifecycle),
);

router.patch("/:id", asyncHandler(LifecycleController.updatePhase));

export default router;
