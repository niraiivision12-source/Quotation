import { api } from "../../lib/axios";

export const getProjects = async (page = 1, limit = 20, search = "", customerId?: string) => {
  const response = await api.get("/projects", {
    params: { page, limit, search, customerId },
  });
  return response.data.data;
};

export const getProjectById = async (id: string) => {
  const response = await api.get(`/projects/${id}`);
  return response.data.data;
};

export const createProject = async (data: {
  customerId: string;
  projectName: string;
  location?: string;
  assignedToId?: string;
  estimatedBudget?: number;
  currentPhase?: string;
}) => {
  const response = await api.post("/projects", data);
  return response.data.data;
};
