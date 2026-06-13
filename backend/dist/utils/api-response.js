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
    static paginated(data) {
        return {
            success: true,
            data: data.items,
            meta: {
                total: data.total,
                page: data.page,
                limit: data.limit,
                totalPages: Math.ceil(data.total / data.limit),
            },
        };
    }
}
exports.ApiResponse = ApiResponse;
//# sourceMappingURL=api-response.js.map