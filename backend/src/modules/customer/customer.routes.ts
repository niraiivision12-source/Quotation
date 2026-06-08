import { Router } from "express";

import { authenticate } from "@/middlewares/auth.middleware";

import { CustomerController } from "@/modules/customer/customer.controller";

const router = Router();

router.use(authenticate);

router.post("/", CustomerController.create);

router.get("/", CustomerController.getAll);

router.get("/:id", CustomerController.getById);

export default router;
