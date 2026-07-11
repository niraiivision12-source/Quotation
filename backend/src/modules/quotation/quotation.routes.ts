import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/async-handler";

import { QuotationController } from "./quotation.controller";

const router = Router();

router.use(authenticate);

router.post("/", asyncHandler(QuotationController.create));

router.get("/", asyncHandler(QuotationController.getAll));

router.get(
  "/project/:projectId",
  asyncHandler(QuotationController.getProjectQuotations),
);

router.post("/:id/revision", asyncHandler(QuotationController.createRevision));

router.patch("/:id/status", asyncHandler(QuotationController.updateStatus));

router.get("/:id", asyncHandler(QuotationController.getById));

export default router;
