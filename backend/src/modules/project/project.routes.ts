import { Router } from "express";

import { authenticate } from "@/middlewares/auth.middleware";
import { ProjectController } from "@/modules/project/project.controller";

const router = Router();

router.use(authenticate);

router.post("/", ProjectController.create);

router.get("/", ProjectController.getAll);

router.get("/:id", ProjectController.getById);

export default router;
