import { Router } from "express";

import { authenticate } from "@/middlewares/auth.middleware";

import { DashboardController } from "@/modules/dashboard/dashboard.controller";

const router = Router();

router.use(authenticate);

router.get("/summary", DashboardController.getSummary);

export default router;
