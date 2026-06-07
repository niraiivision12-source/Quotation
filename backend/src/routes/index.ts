import { Router } from "express";

import authRoutes from "@/modules/auth/auth.routes";
import userRoutes from "@/modules/user/user.routes";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "API Running",
  });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);

export default router;
