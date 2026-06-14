import { api } from "@/lib/axios";

import type {
  CustomerDetails,
  CustomerListResponse,
  CustomerOption,
} from "./customer.types";

export const getCustomers = async (
  page = 1,
  limit = 20,
  search = "",
): Promise<CustomerListResponse> => {
  const response = await api.get("/customers", {
    params: {
      page,
      limit,
      search,
    },
  });

  return response.data.data;
};

export const createCustomer = async (data: {
  name: string;
  mobile: string;
  email?: string;
  address?: string;
}) => {
  const response = await api.post("/customers", data);

  return response.data;
};

export const getCustomerOptions = async (): Promise<CustomerOption[]> => {
  const response = await api.get("/customers", {
    params: {
      page: 1,
      limit: 100,
    },
  });

  return response.data.data.items as CustomerOption[];
};

export const getCustomerById = async (id: string): Promise<CustomerDetails> => {
  const response = await api.get(`/customers/${id}`);

  return response.data.data;
};
