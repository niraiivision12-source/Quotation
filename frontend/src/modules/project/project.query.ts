import { useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/lib/query-client";
import { createProject, getProjects } from "./project.api";

export const useProjects = (page: number, search: string) => {
  return useQuery({
    queryKey: ["projects", page, search],

    queryFn: () => getProjects(page, 20, search),
  });
};

export const useCreateProject = () => {
  return useMutation({
    mutationFn: createProject,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects"],
      });
    },
  });
};
