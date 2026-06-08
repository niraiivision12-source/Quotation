import { Router } from "express";

import { authenticate } from "@/middlewares/auth.middleware";
import { asyncHandler } from "@/utils/async-handler";

import { CustomerController } from "@/modules/customer/customer.controller";

const router = Router();

router.use(authenticate);

router.post("/", asyncHandler(CustomerController.create));

router.get("/", asyncHandler(CustomerController.getAll));

router.get("/:id", asyncHandler(CustomerController.getById));

export default router;
