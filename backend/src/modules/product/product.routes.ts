import { Router } from "express";

import { ProductController } from "@/modules/product/product.controller";

import { authenticate } from "@/middlewares/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/", ProductController.getAll);

export default router;
