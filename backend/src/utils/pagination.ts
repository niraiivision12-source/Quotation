import { PAGINATION } from "@/constants/pagination";

export class Pagination {
  static get(page?: number, limit?: number) {
    const currentPage =
      Number(page) > 0 ? Number(page) : PAGINATION.DEFAULT_PAGE;

    const currentLimit =
      Number(limit) > 0
        ? Math.min(Number(limit), PAGINATION.MAX_LIMIT)
        : PAGINATION.DEFAULT_LIMIT;

    return {
      page: currentPage,
      limit: currentLimit,
      skip: (currentPage - 1) * currentLimit,
    };
  }
}
