import { Router } from "express";

import { authenticate } from "@/middlewares/auth.middleware";
import { asyncHandler } from "@/utils/async-handler";

import { LeadQuotationController } from "@/modules/lead-quotation/lead-quotation.controller";

const router = Router();

router.use(authenticate);

router.post("/", asyncHandler(LeadQuotationController.create));

router.get("/:id", asyncHandler(LeadQuotationController.getById));

router.patch("/:id/status", asyncHandler(LeadQuotationController.updateStatus));

export default router;
