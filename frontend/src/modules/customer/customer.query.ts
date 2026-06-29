import { useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/lib/query-client";

import {
  createCustomer,
  deleteCustomer,
  getCustomerById,
  getCustomerOptions,
  getCustomers,
  updateCustomer,
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

export const useDeleteCustomer = () => {
  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};

import type { CustomerDetails } from "./customer.types";

export const useCustomer = (id: string) => {
  return useQuery<CustomerDetails>({
    queryKey: ["customer", id],

    queryFn: () => getCustomerById(id),

    enabled: !!id,
  });
};

export const useUpdateCustomer = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateCustomer>[1] }) =>
      updateCustomer(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer", variables.id] });
    },
  });
};
