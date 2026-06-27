import { useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/lib/query-client";

import {
  cancelTask,
  completeTask,
  createTask,
  getTasks,
  updateTask,
} from "./task.api";

export const useTasks = (
  page: number,
  filters?: {
    status?: string;
    priority?: string;
    assignedToId?: string;
  },
  limit = 20,
) => {
  return useQuery({
    queryKey: ["tasks", page, filters, limit],
    queryFn: () => getTasks(page, limit, filters),
  });
};

export const useCreateTask = () => {
  return useMutation({
    mutationFn: createTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });
};

export const useUpdateTask = () => {
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof updateTask>[1];
    }) => updateTask(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });
};

export const useCompleteTask = () => {
  return useMutation({
    mutationFn: (id: string) => completeTask(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });
};

export const useCancelTask = () => {
  return useMutation({
    mutationFn: (id: string) => cancelTask(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });
};
