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
