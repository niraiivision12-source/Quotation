import { UserRole } from "@prisma/client";
import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";
import { AuthController } from "./auth.controller";
import { asyncHandler } from "../../utils/async-handler";

const router = Router();

router.post("/login", asyncHandler(AuthController.login));

router.get(
  "/me",
  authenticate,
  authorize(
    UserRole.OWNER,
    UserRole.SALESMAN,
    UserRole.ATTENDANT,
    UserRole.ACCOUNTANT,
  ),
  asyncHandler(AuthController.me),
);

export default router;
