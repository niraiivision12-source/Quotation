import { api } from "@/lib/axios";

export const getCustomers = async (page = 1, limit = 20, search = "") => {
  const response = await api.get("/customers", {
    params: {
      page,
      limit,
      search,
    },
  });

  return response.data.data;
};
