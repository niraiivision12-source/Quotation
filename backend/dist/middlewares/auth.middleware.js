"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const prisma_1 = require("../config/prisma");
const authenticate = async (req, res, next) => {
    try {
        const header = req.headers.authorization;
        if (!header?.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }
        const token = header.split(" ")[1];
        if (process.env.NODE_ENV === "test" && token.startsWith("test-token-")) {
            const role = token.replace("test-token-", "").toUpperCase();
            let user = await prisma_1.prisma.user.findFirst({
                where: { email: `${role.toLowerCase()}@test.com` }
            });
            if (!user) {
                user = await prisma_1.prisma.user.create({
                    data: {
                        id: `test-user-id-${role.toLowerCase()}`,
                        name: `Test ${role}`,
                        email: `${role.toLowerCase()}@test.com`,
                        password: "hashed_password_123",
                        role: role,
                        isActive: true
                    }
                });
            }
            req.user = {
                id: user.id,
                role: user.role,
            };
            return next();
        }
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: decoded.id },
        });
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized - User not found or inactive",
            });
        }
        req.user = {
            id: user.id,
            role: user.role,
        };
        next();
    }
    catch {
        return res.status(401).json({
            success: false,
            message: "Invalid token",
        });
    }
};
exports.authenticate = authenticate;
//# sourceMappingURL=auth.middleware.js.map