import bcrypt from "bcrypt";

import { prisma } from "@/config/prisma";
import { UserRole } from "@prisma/client";

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
      throw new Error("Email already exists");
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

  static async getAll() {
    return prisma.user.findMany({
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
    });
  }
}
