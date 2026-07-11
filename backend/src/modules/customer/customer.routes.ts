import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/async-handler";

import { CustomerController } from "./customer.controller";

const router = Router();

router.use(authenticate);

router.post("/", asyncHandler(CustomerController.create));

router.get("/", asyncHandler(CustomerController.getAll));

router.get("/:id", asyncHandler(CustomerController.getById));

router.patch("/:id", asyncHandler(CustomerController.update));

router.patch("/:id/deactivate", asyncHandler(CustomerController.deactivate));

export default router;
