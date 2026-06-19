import { useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/lib/query-client";
import { createProject, deleteProject, getProjectById, getProjects, updatePhase, updateProject } from "./project.api";

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

export const useUpdatePhase = (projectId: string) => {
  return useMutation({
    mutationFn: ({
      phaseId,
      data,
    }: {
      phaseId: string;
      data: { status: string; remarks?: string };
    }) => updatePhase(phaseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });
};

export const useUpdateProject = () => {
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { projectName?: string; location?: string | null; estimatedBudget?: number };
    }) => updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};

export const useDeleteProject = () => {
  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};

export const useProject = (id: string) => {
  return useQuery({
    queryKey: ["project", id],

    queryFn: () => getProjectById(id),

    enabled: !!id,
  });
};
