export class Pagination {
  static get(page?: number, limit?: number) {
    const currentPage = Number(page) > 0 ? Number(page) : 1;

    const currentLimit = Number(limit) > 0 ? Number(limit) : 20;

    return {
      page: currentPage,
      limit: currentLimit,
      skip: (currentPage - 1) * currentLimit,
    };
  }
}
