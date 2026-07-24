import { useQuery } from "@tanstack/react-query";
import { getProjects, getProjectById } from "./project.api";

export const useProjects = (page: number, search: string) => {
  return useQuery({
    queryKey: ["projects", page, search],
    queryFn: () => getProjects(page, 20, search),
  });
};

export const useProject = (id: string) => {
  return useQuery({
    queryKey: ["project", id],
    queryFn: () => getProjectById(id),
    enabled: !!id,
  });
};
