import { Router } from "express";

import { authenticate } from "@/middlewares/auth.middleware";
import { asyncHandler } from "@/utils/async-handler";

import { ProductController } from "@/modules/product/product.controller";

const router = Router();

router.use(authenticate);

router.get("/", asyncHandler(ProductController.getAll));

export default router;
