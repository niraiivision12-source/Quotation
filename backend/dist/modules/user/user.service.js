"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = require("@/config/prisma");
const app_error_1 = require("@/utils/app-error");
class UserService {
    static async create(data) {
        const exists = await prisma_1.prisma.user.findUnique({
            where: {
                email: data.email,
            },
        });
        if (exists) {
            throw new app_error_1.AppError("Email already exists", 409);
        }
        const password = await bcrypt_1.default.hash(data.password, 10);
        return prisma_1.prisma.user.create({
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
    static async getAll(page, limit) {
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            prisma_1.prisma.user.findMany({
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
            prisma_1.prisma.user.count(),
        ]);
        return {
            items: users,
            total,
            page,
            limit,
        };
    }
    static async getById(id) {
        const user = await prisma_1.prisma.user.findUnique({
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
            throw new app_error_1.AppError("User not found", 404);
        }
        return user;
    }
    static async update(id, data) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id },
        });
        if (!user) {
            throw new app_error_1.AppError("User not found", 404);
        }
        return prisma_1.prisma.user.update({
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
    static async deactivate(id) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id },
        });
        if (!user) {
            throw new app_error_1.AppError("User not found", 404);
        }
        return prisma_1.prisma.user.update({
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
}
exports.UserService = UserService;
//# sourceMappingURL=user.service.js.map