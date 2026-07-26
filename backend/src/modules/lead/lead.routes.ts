import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { checkPermission } from "../../middlewares/permission.middleware";
import { asyncHandler } from "../../utils/async-handler";

import { LeadNoteController } from "../lead-notes/lead-note.controller";
import { LeadController } from "./lead.controller";

const router = Router();

router.use(authenticate);

router.post("/", checkPermission("createLeads"), asyncHandler(LeadController.create));

router.get("/", asyncHandler(LeadController.getAll));

router.get("/stats", asyncHandler(LeadController.getStats));

router.get("/check-mobile", asyncHandler(LeadController.checkMobile));

router.get("/:id", asyncHandler(LeadController.getById));

router.post("/:id/convert", asyncHandler(LeadController.convert));

router.patch("/:id", asyncHandler(LeadController.update));

router.patch("/:id/deactivate", asyncHandler(LeadController.deactivate));

router.get("/:id/projects", asyncHandler(LeadController.getProjects));

router.post("/:id/notes", asyncHandler(LeadNoteController.addNote));

router.get("/:id/notes", asyncHandler(LeadNoteController.getNotes));

router.get("/stats", asyncHandler(LeadController.getStats));

export default router;
