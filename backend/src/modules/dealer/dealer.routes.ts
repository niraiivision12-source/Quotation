import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { DealerController } from "./dealer.controller";

const router = Router();

router.use(authenticate);

router.post("/", asyncHandler(DealerController.create));
router.get("/", asyncHandler(DealerController.getAll));
router.get("/:id", asyncHandler(DealerController.getById));
router.patch("/:id", asyncHandler(DealerController.update));
router.patch("/:id/deactivate", asyncHandler(DealerController.deactivate));

export default router;
