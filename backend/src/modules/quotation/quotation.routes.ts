import { Router } from "express";

import { authenticate } from "@/middlewares/auth.middleware";

import { QuotationController } from "@/modules/quotation/quotation.controller";

const router = Router();

router.use(authenticate);

router.post("/", QuotationController.create);

export default router;
