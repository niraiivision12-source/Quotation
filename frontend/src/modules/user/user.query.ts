import { useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/lib/query-client";

import { createUser, deleteUser, getUsers, updateUser } from "./user.api";
import type { UserRole } from "./user.types";

export const useUsers = (page: number) => {
  return useQuery({
    queryKey: ["users", page],
    queryFn: () => getUsers(page, 20),
  });
};

export const useCreateUser = () => {
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useUpdateUser = () => {
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        name?: string;
        role?: UserRole;
        isActive?: boolean;
      };
    }) => updateUser(id, data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["users"],
      });
    },
  });
};

export const useDeleteUser = () => {
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};
