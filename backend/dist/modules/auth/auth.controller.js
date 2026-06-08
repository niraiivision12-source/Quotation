"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const auth_validation_1 = require("./auth.validation");
class AuthController {
    static async login(req, res) {
        const data = auth_validation_1.loginSchema.parse(req.body);
        const result = await auth_service_1.AuthService.login(data.email, data.password);
        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: result,
        });
    }
    static async me(req, res) {
        return res.status(200).json({
            success: true,
            user: req.user,
        });
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map