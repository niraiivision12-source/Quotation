"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const permission_middleware_1 = require("../../middlewares/permission.middleware");
const async_handler_1 = require("../../utils/async-handler");
const app_error_1 = require("../../utils/app-error");
const product_controller_1 = require("./product.controller");
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB file size limit
    },
    fileFilter: (_req, file, cb) => {
        const allowedExtensions = /\.(csv|xlsx|xls|ods|tsv)$/i;
        if (!file.originalname.match(allowedExtensions)) {
            return cb(new app_error_1.AppError("Unsupported file type. Please upload a valid CSV, XLS, XLSX, TSV, or ODS file.", 400), false);
        }
        cb(null, true);
    },
});
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post("/", (0, permission_middleware_1.checkPermission)("manageProducts"), (0, async_handler_1.asyncHandler)(product_controller_1.ProductController.create));
router.get("/", (0, async_handler_1.asyncHandler)(product_controller_1.ProductController.getAll));
router.get("/:id", (0, async_handler_1.asyncHandler)(product_controller_1.ProductController.getById));
router.patch("/:id", (0, permission_middleware_1.checkPermission)("manageProducts"), (0, async_handler_1.asyncHandler)(product_controller_1.ProductController.update));
router.patch("/:id/deactivate", (0, permission_middleware_1.checkPermission)("manageProducts"), (0, async_handler_1.asyncHandler)(product_controller_1.ProductController.deactivate));
router.post("/sync", (0, permission_middleware_1.checkPermission)("manageProducts"), (0, async_handler_1.asyncHandler)(product_controller_1.ProductController.sync));
router.post("/import/preview", (0, permission_middleware_1.checkPermission)("manageProducts"), upload.single("file"), (0, async_handler_1.asyncHandler)(product_controller_1.ProductController.previewImport));
router.post("/import/confirm", (0, permission_middleware_1.checkPermission)("manageProducts"), (0, async_handler_1.asyncHandler)(product_controller_1.ProductController.confirmImport));
exports.default = router;
//# sourceMappingURL=product.routes.js.map