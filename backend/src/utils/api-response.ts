export class ApiResponse {
  static success(data: unknown = null, message = "Success") {
    return {
      success: true,
      message,
      data,
    };
  }

  static paginated(data: {
    items: unknown[];
    total: number;
    page: number;
    limit: number;
  }) {
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
