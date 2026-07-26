import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "../../lib/query-client";
import { getProjects, getProjectById, createProject } from "./project.api";

export const useProjects = (page: number, search: string, customerId?: string) => {
  return useQuery({
    queryKey: ["projects", page, search, customerId],
    queryFn: () => getProjects(page, 20, search, customerId),
  });
};

export const useProject = (id: string) => {
  return useQuery({
    queryKey: ["project", id],
    queryFn: () => getProjectById(id),
    enabled: !!id,
  });
};

export const useCreateProject = () => {
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["lead-projects"] });
    },
  });
};
