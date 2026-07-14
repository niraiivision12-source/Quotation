import { useQuery } from "@tanstack/react-query";

import { getProductList, getProducts } from "./product.api";

export function useProducts(search = "") {
  return useQuery({
    queryKey: ["products", search],

    queryFn: () => getProducts(search),
  });
}

export function useProductList(page = 1, limit = 25, search = "") {
  return useQuery({
    queryKey: ["products", "list", page, limit, search],

    queryFn: () => getProductList(page, limit, search),
  });
}
