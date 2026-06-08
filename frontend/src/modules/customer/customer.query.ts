import { useQuery } from "@tanstack/react-query";

import { getCustomers } from "./customer.api";

export const useCustomers = (page: number, search: string) => {
  return useQuery({
    queryKey: ["customers", page, search],

    queryFn: () => getCustomers(page, 20, search),
  });
};
