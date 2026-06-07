import { UserRole } from "@prisma/client";
import { Router } from "express";

import { authenticate } from "@/middlewares/auth.middleware";
import { authorize } from "@/middlewares/role.middleware";
import { UserController } from "@/modules/user/user.controller";

const router = Router();

router.use(authenticate);

router.post("/", authorize(UserRole.OWNER), UserController.create);

router.get("/", authorize(UserRole.OWNER), UserController.getAll);

export default router;
