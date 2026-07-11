import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { SettingsController } from "./settings.controller";
import { UserRole } from "@prisma/client";

const router = Router();

router.use(authenticate);

router.get("/", asyncHandler(SettingsController.get));

router.put("/", authorize(UserRole.OWNER), asyncHandler(SettingsController.update));
router.get("/export", authorize(UserRole.OWNER), asyncHandler(SettingsController.export));
router.post("/import", authorize(UserRole.OWNER), asyncHandler(SettingsController.import));

export default router;
