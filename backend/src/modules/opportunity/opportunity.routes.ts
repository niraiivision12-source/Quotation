import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { checkPermission } from "../../middlewares/permission.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { OpportunityController } from "./opportunity.controller";

const router = Router();

router.use(authenticate);

router.get("/", asyncHandler(OpportunityController.getAll));
router.get("/stats", asyncHandler(OpportunityController.getStats));
router.get("/counts", asyncHandler(OpportunityController.getCounts));
router.get("/:id", asyncHandler(OpportunityController.getById));
router.patch("/:id", asyncHandler(OpportunityController.update));
router.delete("/:id", checkPermission("accessSettings"), asyncHandler(OpportunityController.remove));

export default router;
