import { Router } from "express";

import { authenticate } from "@/middlewares/auth.middleware";

import { LifecycleController } from "@/modules/lifecycle/lifecycle.controller";

const router = Router();

router.use(authenticate);

router.get("/project/:projectId", LifecycleController.getProjectLifecycle);

router.patch("/:id", LifecycleController.updatePhase);

export default router;
