import { Router } from "express";

import { authenticate } from "@/middlewares/auth.middleware";
import { asyncHandler } from "@/utils/async-handler";

import { DashboardController } from "@/modules/dashboard/dashboard.controller";

const router = Router();

router.use(authenticate);

router.get("/summary", asyncHandler(DashboardController.getSummary));

export default router;
