"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const permission_middleware_1 = require("../../middlewares/permission.middleware");
const async_handler_1 = require("../../utils/async-handler");
const enquiry_controller_1 = require("./enquiry.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post("/", (0, async_handler_1.asyncHandler)(enquiry_controller_1.EnquiryController.create));
router.get("/", (0, async_handler_1.asyncHandler)(enquiry_controller_1.EnquiryController.getAll));
router.get("/check-mobile", (0, async_handler_1.asyncHandler)(enquiry_controller_1.EnquiryController.checkMobile));
router.post("/:id/triage", (0, permission_middleware_1.checkPermission)("accessSettings"), (0, async_handler_1.asyncHandler)(enquiry_controller_1.EnquiryController.triage)); // Only owner (who can access settings) can triage
router.post("/:id/ignore", (0, permission_middleware_1.checkPermission)("accessSettings"), (0, async_handler_1.asyncHandler)(enquiry_controller_1.EnquiryController.ignore));
exports.default = router;
//# sourceMappingURL=enquiry.routes.js.map