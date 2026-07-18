import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { getProductList, getProducts, previewProductImport, confirmProductImport, updateProduct } from "./product.api";

export function useProducts(search = "") {
  return useQuery({
    queryKey: ["products", search],

    queryFn: ({ signal }) => getProducts(search, 50, signal),

    // Hold the previous results while the next search is in flight, so the
    // dropdown doesn't blank out between keystrokes.
    placeholderData: keepPreviousData,

    // The catalogue barely changes during a quotation; don't refetch it for
    // every row that mounts.
    staleTime: 5 * 60 * 1000,
  });
}

export function useProductList(page = 1, limit = 25, search = "", stockStatus = "", priceStatus = "") {
  return useQuery({
    queryKey: ["products", "list", page, limit, search, stockStatus, priceStatus],

    queryFn: ({ signal }) => getProductList(page, limit, search, stockStatus, priceStatus, signal),
  });
}

export function useAllProducts() {
  return useQuery({
    queryKey: ["products", "all"],
    queryFn: () => getProducts("", 20000),
    staleTime: 10 * 60 * 1000,
  });
}

export function usePreviewProductImport() {
  return useMutation({
    mutationFn: (file: File) => previewProductImport(file),
  });
}

export function useConfirmProductImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { inserts: any[]; updates: any[] }) =>
      confirmProductImport(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      updateProduct(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

