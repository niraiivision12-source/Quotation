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

export const updatePhase = async (
  phaseId: string,
  data: { status: string; remarks?: string },
) => {
  const response = await api.patch(`/lifecycle/${phaseId}`, data);
  return response.data;
};

export const updateProject = async (
  id: string,
  data: {
    projectName?: string;
    location?: string | null;
    estimatedBudget?: number | null;
    status?: string;
    startDate?: string | null;
    expectedCompletion?: string | null;
    assignedToId?: string | null;
  },
) => {
  const response = await api.patch(`/projects/${id}`, data);
  return response.data;
};

export const deleteProject = async (id: string) => {
  const response = await api.patch(`/projects/${id}/deactivate`);
  return response.data;
};

export const updateProjectPhase = async (
  id: string,
  phase: string,
) => {
  const response = await api.patch(`/projects/${id}/phase`, { phase });
  return response.data.data;
};
