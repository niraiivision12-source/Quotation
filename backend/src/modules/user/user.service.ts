import bcrypt from "bcrypt";

import { prisma } from "@/config/prisma";
import { UserRole } from "@prisma/client";

import { AppError } from "@/utils/app-error";

export class UserService {
  static async create(data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }) {
    const exists = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (exists) {
      throw new AppError("Email already exists", 409);
    }

    const password = await bcrypt.hash(data.password, 10);

    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password,
        role: data.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  static async getAll(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          isActive: true,
        },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.user.count({
        where: {
          isActive: true,
        },
      }),
    ]);

    return {
      items: users,
      total,
      page,
      limit,
    };
  }

  static async getById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }

  static async update(
    id: string,
    data: {
      name?: string;
      role?: UserRole;
      isActive?: boolean;
    },
  ) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  static async deactivate(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return prisma.user.update({
      where: { id },
      data: {
        isActive: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });
  }

  static async hardDelete(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    await prisma.$transaction(async (tx) => {
      // Nullify optional references
      await tx.lead.updateMany({
        where: { assignedToId: id },
        data: { assignedToId: null },
      });
      await tx.lead.updateMany({
        where: { contactOwnerId: id },
        data: { contactOwnerId: null },
      });
      await tx.customer.updateMany({
        where: { assignedToId: id },
        data: { assignedToId: null },
      });
      await tx.customer.updateMany({
        where: { contactOwnerId: id },
        data: { contactOwnerId: null },
      });
      await tx.project.updateMany({
        where: { assignedToId: id },
        data: { assignedToId: null },
      });
      await tx.projectPhaseTracking.updateMany({
        where: { assignedToId: id },
        data: { assignedToId: null },
      });

      // Delete records with required user FK
      await tx.reminder.deleteMany({ where: { userId: id } });
      await tx.task.deleteMany({ where: { assignedToId: id } });

      await tx.user.delete({ where: { id } });
    });
  }
}
