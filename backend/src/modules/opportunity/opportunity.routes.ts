import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";
import { UserRole } from "@prisma/client";
import { asyncHandler } from "../../utils/async-handler";
import { OpportunityController } from "./opportunity.controller";

const router = Router();

router.use(authenticate);

router.get("/", asyncHandler(OpportunityController.getAll));
router.get("/stats", asyncHandler(OpportunityController.getStats));
router.get("/counts", asyncHandler(OpportunityController.getCounts));
router.get("/:id", asyncHandler(OpportunityController.getById));
router.patch("/:id", asyncHandler(OpportunityController.update));
router.delete("/:id", authorize(UserRole.OWNER), asyncHandler(OpportunityController.delete));

export default router;
