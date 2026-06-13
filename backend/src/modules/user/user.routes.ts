import { UserRole } from "@prisma/client";
import { Router } from "express";

import { authenticate } from "@/middlewares/auth.middleware";
import { authorize } from "@/middlewares/role.middleware";
import { UserController } from "@/modules/user/user.controller";
import { asyncHandler } from "@/utils/async-handler";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  authorize(UserRole.OWNER),
  asyncHandler(UserController.create),
);

router.get("/", authorize(UserRole.OWNER), asyncHandler(UserController.getAll));

router.get(
  "/:id",
  authorize(UserRole.OWNER),
  asyncHandler(UserController.getById),
);

router.patch(
  "/:id",
  authorize(UserRole.OWNER),
  asyncHandler(UserController.update),
);

router.patch(
  "/:id/deactivate",
  authorize(UserRole.OWNER),
  asyncHandler(UserController.deactivate),
);

export default router;
