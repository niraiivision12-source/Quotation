import { NextFunction, Request, Response } from "express";
import { prisma } from "@/config/prisma";
import { UserRole } from "@prisma/client";

export const checkPermission = (action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { role } = req.user;

      // OWNER role has root/super access, bypasses settings-based permission block
      if (role === UserRole.OWNER) {
        return next();
      }

      // Fetch current configuration
      let settings = await prisma.systemSettings.findUnique({
        where: { id: "default" },
      });

      if (!settings) {
        // Fallback: if settings row isn't created yet, allow by default
        return next();
      }

      const permissions = settings.rolePermissions as Record<string, string[]> | null;
      if (!permissions || !permissions[action]) {
        // If permission mapping is empty, restrict or allow? Let's allow by default but warn
        return next();
      }

      const allowedRoles = permissions[action];
      if (allowedRoles.includes(role)) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${role}' does not have permission to perform action '${action}'`,
      });
    } catch (error) {
      next(error);
    }
  };
};
