import { api } from "@/lib/axios";

import type { UserListResponse } from "./user.types";

export const getUsers = async (page = 1, limit = 20): Promise<UserListResponse> => {
  const response = await api.get("/users", { params: { page, limit } });
  return response.data.data;
};

export const createUser = async (data: {
  name: string;
  email: string;
  password: string;
  role: string;
}) => {
  const response = await api.post("/users", data);
  return response.data;
};
