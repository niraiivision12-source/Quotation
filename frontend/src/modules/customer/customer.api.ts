import { api } from "@/lib/axios";

import type { CustomerListResponse } from "./customer.types";

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
