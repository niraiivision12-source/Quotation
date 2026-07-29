import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { checkPermission } from "../../middlewares/permission.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { EnquiryController } from "./enquiry.controller";

const router = Router();

router.use(authenticate);

// Basic CRUD
router.post("/", asyncHandler(EnquiryController.create));
router.get("/", asyncHandler(EnquiryController.getAll));
router.get("/check-mobile", asyncHandler(EnquiryController.checkMobile));

// CSV Export (owner-only)
router.get("/export", checkPermission("accessSettings"), asyncHandler(EnquiryController.exportCSV));

// Bulk actions (owner-only)
router.post("/bulk-delete", checkPermission("accessSettings"), asyncHandler(EnquiryController.bulkDelete));
router.post("/bulk-ignore", checkPermission("accessSettings"), asyncHandler(EnquiryController.bulkIgnore));

// Single item actions
router.patch("/:id", checkPermission("accessSettings"), asyncHandler(EnquiryController.update)); // Update PENDING enquiry (owner-only)
router.delete("/:id", checkPermission("accessSettings"), asyncHandler(EnquiryController.remove)); // Hard delete (owner-only)
router.post("/:id/triage", checkPermission("accessSettings"), asyncHandler(EnquiryController.triage)); // Only owner can triage
router.post("/:id/ignore", checkPermission("accessSettings"), asyncHandler(EnquiryController.ignore));
router.post("/:id/restore", checkPermission("accessSettings"), asyncHandler(EnquiryController.restore)); // Restore IGNORED → PENDING (owner-only)

export default router;
