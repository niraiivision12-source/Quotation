"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pagination = void 0;
const pagination_1 = require("../constants/pagination");
class Pagination {
    static get(page, limit) {
        const currentPage = Number(page) > 0 ? Number(page) : pagination_1.PAGINATION.DEFAULT_PAGE;
        const currentLimit = Number(limit) > 0
            ? Math.min(Number(limit), pagination_1.PAGINATION.MAX_LIMIT)
            : pagination_1.PAGINATION.DEFAULT_LIMIT;
        return {
            page: currentPage,
            limit: currentLimit,
            skip: (currentPage - 1) * currentLimit,
        };
    }
}
exports.Pagination = Pagination;
//# sourceMappingURL=pagination.js.map