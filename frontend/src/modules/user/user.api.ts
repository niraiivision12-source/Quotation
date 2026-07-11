import { api } from "../../lib/axios";

import type { UserListResponse, UserRole } from "./user.types";

export const getUsers = async (
  page = 1,
  limit = 20,
): Promise<UserListResponse> => {
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

export const updateUser = async (
  id: string,
  data: {
    name?: string;
    role?: UserRole;
    isActive?: boolean;
  },
) => {
  const response = await api.patch(`/users/${id}`, data);

  return response.data;
};

export const deleteUser = async (id: string) => {
  const response = await api.patch(`/users/${id}/deactivate`);
  return response.data;
};
