import { Router } from "express";

import { authenticate } from "@/middlewares/auth.middleware";

import { QuotationController } from "@/modules/quotation/quotation.controller";

const router = Router();

router.use(authenticate);

router.post("/", QuotationController.create);

router.get("/", QuotationController.getAll);

router.get("/project/:projectId", QuotationController.getProjectQuotations);

router.post("/:id/revision", QuotationController.createRevision);

router.patch("/:id/status", QuotationController.updateStatus);

router.get("/:id", QuotationController.getById);

export default router;
