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
  stockStatus = "",
  priceStatus = "",
  signal?: AbortSignal,
): Promise<ProductListResponse> => {
  const response = await api.get("/products", {
    params: {
      page,
      limit,
      search: search || undefined,
      stockStatus: stockStatus || undefined,
      priceStatus: priceStatus || undefined,
    },
    signal,
  });

  return response.data.data;
};

export const previewProductImport = async (file: File): Promise<any> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/products/import/preview", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data.data;
};

export const confirmProductImport = async (payload: {
  inserts: any[];
  updates: any[];
}): Promise<any> => {
  const response = await api.post("/products/import/confirm", payload);
  return response.data.data;
};

export const updateProduct = async (
  id: string,
  payload: any,
): Promise<any> => {
  const response = await api.patch(`/products/${id}`, payload);
  return response.data.data;
};

