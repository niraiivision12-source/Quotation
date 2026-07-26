"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const async_handler_1 = require("../../utils/async-handler");
const dealer_controller_1 = require("./dealer.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post("/", (0, async_handler_1.asyncHandler)(dealer_controller_1.DealerController.create));
router.get("/", (0, async_handler_1.asyncHandler)(dealer_controller_1.DealerController.getAll));
router.get("/:id", (0, async_handler_1.asyncHandler)(dealer_controller_1.DealerController.getById));
router.patch("/:id", (0, async_handler_1.asyncHandler)(dealer_controller_1.DealerController.update));
router.patch("/:id/deactivate", (0, async_handler_1.asyncHandler)(dealer_controller_1.DealerController.deactivate));
exports.default = router;
//# sourceMappingURL=dealer.routes.js.map