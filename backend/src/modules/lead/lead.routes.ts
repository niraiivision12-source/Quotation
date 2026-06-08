import { Router } from "express";

import { authenticate } from "@/middlewares/auth.middleware";
import { LeadController } from "@/modules/lead/lead.controller";

const router = Router();

router.use(authenticate);

router.post("/", LeadController.create);

router.get("/", LeadController.getAll);

router.get("/:id", LeadController.getById);

router.post("/:id/convert", LeadController.convert);

export default router;
