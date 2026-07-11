import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { checkPermission } from "../../middlewares/permission.middleware";
import { asyncHandler } from "../../utils/async-handler";

import { ProductController } from "./product.controller";

const router = Router();

router.use(authenticate);

router.post("/", checkPermission("manageProducts"), asyncHandler(ProductController.create));

router.get("/", asyncHandler(ProductController.getAll));

router.get("/:id", asyncHandler(ProductController.getById));

router.patch("/:id", checkPermission("manageProducts"), asyncHandler(ProductController.update));

router.patch("/:id/deactivate", checkPermission("manageProducts"), asyncHandler(ProductController.deactivate));

router.post("/sync", checkPermission("manageProducts"), asyncHandler(ProductController.sync));

export default router;
