import { useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/lib/query-client";

import {
  cancelTask,
  completeTask,
  createTask,
  getTasks,
  updateTask,
  deleteTask,
} from "./task.api";

export const useTasks = (
  page: number,
  filters?: {
    status?: string;
    priority?: string;
    assignedToId?: string;
    leadId?: string;
    customerId?: string;
    projectId?: string;
    paymentId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  },
  limit = 20,
  enabled = true,
) => {
  return useQuery({
    queryKey: ["tasks", page, filters, limit],
    queryFn: () => getTasks(page, limit, filters),
    enabled,
  });
};

export const useCreateTask = () => {
  return useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
    },
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
    },
  });
};

export const useCompleteTask = () => {
  return useMutation({
    mutationFn: (id: string) => completeTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
    },
  });
};

export const useCancelTask = () => {
  return useMutation({
    mutationFn: (id: string) => cancelTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
    },
  });
};

export const useDeleteTask = () => {
  return useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
    },
  });
};
