import { useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/lib/query-client";

import {
  createCustomer,
  getCustomerOptions,
  getCustomers,
} from "./customer.api";

import type { CustomerOption } from "./customer.types";

export const useCustomers = (page: number, search: string) => {
  return useQuery({
    queryKey: ["customers", page, search],

    queryFn: () => getCustomers(page, 20, search),
  });
};

export const useCreateCustomer = () => {
  return useMutation({
    mutationFn: createCustomer,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["customers"],
      });
    },
  });
};

export const useCustomerOptions = () => {
  return useQuery<CustomerOption[]>({
    queryKey: ["customer-options"],
    queryFn: getCustomerOptions,
  });
};
