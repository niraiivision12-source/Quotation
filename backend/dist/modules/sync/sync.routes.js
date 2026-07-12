"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const syncApiKey_middleware_1 = require("../../middlewares/syncApiKey.middleware");
const async_handler_1 = require("../../utils/async-handler");
const sync_controller_1 = require("./sync.controller");
const router = (0, express_1.Router)();
router.use(syncApiKey_middleware_1.syncApiKeyMiddleware);
router.post('/stock-groups', (0, async_handler_1.asyncHandler)(sync_controller_1.syncController.syncStockGroups));
router.post('/units', (0, async_handler_1.asyncHandler)(sync_controller_1.syncController.syncUnits));
router.post('/products', (0, async_handler_1.asyncHandler)(sync_controller_1.syncController.syncProducts));
exports.default = router;
//# sourceMappingURL=sync.routes.js.map