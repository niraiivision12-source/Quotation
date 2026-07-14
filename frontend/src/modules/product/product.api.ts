import { api } from "../../lib/axios";

import type { ProductListResponse } from "./product.types";

export const getProducts = async (
  search = "",
): Promise<ProductListResponse> => {
  const response = await api.get("/products", {
    params: {
      page: 1,
      limit: 50,
      search,
    },
  });

  return response.data.data;
};

/** Paginated variant, for the Products page. */
export const getProductList = async (
  page = 1,
  limit = 25,
  search = "",
): Promise<ProductListResponse> => {
  const response = await api.get("/products", {
    params: {
      page,
      limit,
      search: search || undefined,
    },
  });

  return response.data.data;
};
