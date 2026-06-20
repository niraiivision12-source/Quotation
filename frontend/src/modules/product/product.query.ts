import { useQuery } from "@tanstack/react-query";

import { getProducts } from "./product.api";

export function useProducts(search = "") {
  return useQuery({
    queryKey: ["products", search],

    queryFn: () => getProducts(search),
  });
}
