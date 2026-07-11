"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
const prisma_1 = require("../../config/prisma");
const app_error_1 = require("../../utils/app-error");
class AuthService {
    static async login(email, password) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            throw new app_error_1.AppError("Invalid credentials", 401);
        }
        const validPassword = await bcrypt_1.default.compare(password, user.password);
        if (!validPassword) {
            throw new app_error_1.AppError("Invalid credentials", 401);
        }
        const token = jsonwebtoken_1.default.sign({
            id: user.id,
            role: user.role,
        }, env_1.env.JWT_SECRET, {
            expiresIn: "7d",
        });
        return {
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        };
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map