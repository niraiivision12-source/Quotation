import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { OpportunityController } from "./opportunity.controller";

const router = Router();

router.use(authenticate);

router.get("/", asyncHandler(OpportunityController.getAll));
router.get("/stats", asyncHandler(OpportunityController.getStats));
router.get("/:id", asyncHandler(OpportunityController.getById));
router.patch("/:id", asyncHandler(OpportunityController.update));

export default router;
