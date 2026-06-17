import { Router } from "express";

import { authenticate } from "@/middlewares/auth.middleware";
import { asyncHandler } from "@/utils/async-handler";

import { LeadController } from "@/modules/lead/lead.controller";

const router = Router();

router.use(authenticate);

router.post("/", asyncHandler(LeadController.create));

router.get("/", asyncHandler(LeadController.getAll));

router.get("/:id", asyncHandler(LeadController.getById));

router.get("/:id/lifecycle", asyncHandler(LeadController.getLifecycle));

router.post("/:id/convert", asyncHandler(LeadController.convert));

router.patch("/:id", asyncHandler(LeadController.update));

router.patch("/:id/deactivate", asyncHandler(LeadController.deactivate));

export default router;
