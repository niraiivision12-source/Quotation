import { Router } from "express";
import { UserRole } from "@prisma/client";

import { authenticate } from "@/middlewares/auth.middleware";
import { authorize } from "@/middlewares/role.middleware";

import authRoutes from "@/modules/auth/auth.routes";
import customerRoutes from "@/modules/customer/customer.routes";
import dashboardRoutes from "@/modules/dashboard/dashboard.routes";
import leadRoutes from "@/modules/lead/lead.routes";
import lifecycleRoutes from "@/modules/lifecycle/lifecycle.routes";
import productRoutes from "@/modules/product/product.routes";
import projectRoutes from "@/modules/project/project.routes";
import quotationRoutes from "@/modules/quotation/quotation.routes";
import reminderRoutes from "@/modules/reminder/reminder.routes";
import taskRoutes from "@/modules/task/task.routes";
import userRoutes from "@/modules/user/user.routes";
import settingsRoutes from "@/modules/settings/settings.routes";
import paymentRoutes from "@/modules/payment/payment.routes";
import devRoutes from "./dev.routes";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "API Running",
  });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/products", productRoutes);
router.use("/customers", customerRoutes);
router.use("/projects", projectRoutes);
router.use("/leads", leadRoutes);
router.use("/reminders", reminderRoutes);
router.use("/tasks", taskRoutes);
router.use("/quotations", quotationRoutes);
router.use("/lifecycle", lifecycleRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/settings", settingsRoutes);
router.use("/payments", paymentRoutes);

// Dev Explorer routes, restricted to OWNER role
router.use("/dev", authenticate, authorize(UserRole.OWNER), devRoutes);

export default router;

