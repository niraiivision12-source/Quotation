import { api } from "@/lib/axios";

import type { ProjectListResponse } from "./project.types";

export const getProjects = async (
  page = 1,
  limit = 20,
  search = "",
): Promise<ProjectListResponse> => {
  const response = await api.get("/projects", {
    params: {
      page,
      limit,
      search,
    },
  });

  return response.data.data;
};

export const createProject = async (data: {
  customerId: string;
  projectName: string;
  location?: string;
  estimatedBudget?: number;
}) => {
  const response = await api.post("/projects", data);

  return response.data;
};

export const getProjectById = async (id: string) => {
  const response = await api.get(`/projects/${id}`);

  return response.data.data;
};
