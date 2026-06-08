"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
class ApiResponse {
    static success(data = null, message = "Success") {
        return {
            success: true,
            message,
            data,
        };
    }
    static error(message = "Error") {
        return {
            success: false,
            message,
        };
    }
}
exports.ApiResponse = ApiResponse;
//# sourceMappingURL=api-response.js.map