import { Router } from "express";

import { authenticate } from "@/middlewares/auth.middleware";

import { asyncHandler } from "@/utils/async-handler";

import { ProductController } from "@/modules/product/product.controller";

const router = Router();

router.use(authenticate);

router.post("/", asyncHandler(ProductController.create));

router.get("/", asyncHandler(ProductController.getAll));

router.get("/:id", asyncHandler(ProductController.getById));

router.patch("/:id", asyncHandler(ProductController.update));

router.patch("/:id/deactivate", asyncHandler(ProductController.deactivate));

router.post("/sync", asyncHandler(ProductController.sync));

export default router;
