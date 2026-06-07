import { UserRole } from "@prisma/client";
import { Router } from "express";

import { authenticate } from "@/middlewares/auth.middleware";
import { authorize } from "@/middlewares/role.middleware";
import { AuthController } from "@/modules/auth/auth.controller";

const router = Router();

router.post("/login", AuthController.login);

router.get(
  "/me",
  authenticate,
  authorize(
    UserRole.OWNER,
    UserRole.SALESMAN,
    UserRole.ATTENDANT,
    UserRole.ACCOUNTANT,
  ),
  AuthController.me,
);

export default router;
