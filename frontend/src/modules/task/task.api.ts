import { api } from "@/lib/axios";

import type { Task, TaskListResponse } from "./task.types";

export const getTasks = async (
  page = 1,
  limit = 20,
  filters?: {
    status?: string;
    priority?: string;
    assignedToId?: string;
  },
): Promise<TaskListResponse> => {
  const response = await api.get("/tasks", {
    params: { page, limit, ...filters },
  });
  return response.data.data;
};

export const getTaskById = async (id: string): Promise<Task> => {
  const response = await api.get(`/tasks/${id}`);
  return response.data.data;
};

export const createTask = async (data: {
  title: string;
  description?: string;
  priority: string;
  dueAt?: string;
  assignedToId: string;
  leadId?: string;
  customerId?: string;
  projectId?: string;
}) => {
  const response = await api.post("/tasks", data);
  return response.data.data;
};

export const updateTask = async (
  id: string,
  data: {
    title?: string;
    description?: string | null;
    priority?: string;
    status?: string;
    dueAt?: string;
    assignedToId?: string;
  },
) => {
  const response = await api.patch(`/tasks/${id}`, data);
  return response.data.data;
};

export const completeTask = async (id: string) => {
  const response = await api.patch(`/tasks/${id}/complete`);
  return response.data.data;
};

export const cancelTask = async (id: string) => {
  const response = await api.patch(`/tasks/${id}/cancel`);
  return response.data.data;
};
