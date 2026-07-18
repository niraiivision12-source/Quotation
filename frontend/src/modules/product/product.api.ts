import { api } from "../../lib/axios";

import type { ProductListResponse } from "./product.types";

export const getProducts = async (
  search = "",
  limit = 50,
  signal?: AbortSignal,
): Promise<ProductListResponse> => {
  const response = await api.get("/products", {
    params: {
      page: 1,
      limit,
      search,
    },
    signal,
  });

  return response.data.data;
};

/** Paginated variant, for the Products page. */
export const getProductList = async (
  page = 1,
  limit = 25,
  search = "",
  signal?: AbortSignal,
): Promise<ProductListResponse> => {
  const response = await api.get("/products", {
    params: {
      page,
      limit,
      search: search || undefined,
    },
    signal,
  });

  return response.data.data;
};
