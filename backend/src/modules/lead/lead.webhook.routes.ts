import { Router } from "express";

import { LeadController } from "@/modules/lead/lead.controller";
import { asyncHandler } from "@/utils/async-handler";

const router = Router();

router.post("/", asyncHandler(LeadController.webhook));

export default router;
