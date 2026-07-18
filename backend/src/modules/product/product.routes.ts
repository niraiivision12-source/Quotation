import { Router } from "express";
import multer from "multer";

import { authenticate } from "../../middlewares/auth.middleware";
import { checkPermission } from "../../middlewares/permission.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { AppError } from "../../utils/app-error";

import { ProductController } from "./product.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = /\.(csv|xlsx|xls|ods|tsv)$/i;
    if (!file.originalname.match(allowedExtensions)) {
      return cb(new AppError("Unsupported file type. Please upload a valid CSV, XLS, XLSX, TSV, or ODS file.", 400) as any, false);
    }
    cb(null, true);
  },
});

const router = Router();

router.use(authenticate);

router.post("/", checkPermission("manageProducts"), asyncHandler(ProductController.create));

router.get("/", asyncHandler(ProductController.getAll));

router.get("/:id", asyncHandler(ProductController.getById));

router.patch("/:id", checkPermission("manageProducts"), asyncHandler(ProductController.update));

router.patch("/:id/deactivate", checkPermission("manageProducts"), asyncHandler(ProductController.deactivate));

router.post("/sync", checkPermission("manageProducts"), asyncHandler(ProductController.sync));

router.post(
  "/import/preview",
  checkPermission("manageProducts"),
  upload.single("file"),
  asyncHandler(ProductController.previewImport)
);

router.post(
  "/import/confirm",
  checkPermission("manageProducts"),
  asyncHandler(ProductController.confirmImport)
);

export default router;

