import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { checkPermission } from "../../middlewares/permission.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { EnquiryController } from "./enquiry.controller";

const router = Router();

router.use(authenticate);

router.post("/", asyncHandler(EnquiryController.create));
router.get("/", asyncHandler(EnquiryController.getAll));
router.post("/:id/triage", checkPermission("accessSettings"), asyncHandler(EnquiryController.triage)); // Only owner (who can access settings) can triage
router.post("/:id/ignore", checkPermission("accessSettings"), asyncHandler(EnquiryController.ignore));

export default router;
