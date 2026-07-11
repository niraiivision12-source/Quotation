import { useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "../../lib/query-client";
import { createProject, deleteProject, getProjectById, getProjects, updatePhase, updateProject, updateProjectPhase } from "./project.api";

export const useProjects = (page: number, search: string, limit = 20) => {
  return useQuery({
    queryKey: ["projects", page, search, limit],

    queryFn: () => getProjects(page, limit, search),
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
      queryClient.invalidateQueries({ queryKey: ["projects"] });
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
      data: {
        projectName?: string;
        location?: string | null;
        estimatedBudget?: number | null;
        status?: string;
        startDate?: string | null;
        expectedCompletion?: string | null;
        assignedToId?: string | null;
        paymentDetails?: any;
      };
    }) => updateProject(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", variables.id] });
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

export const useUpdateProjectPhase = () => {
  return useMutation({
    mutationFn: ({ id, phase }: { id: string; phase: string }) =>
      updateProjectPhase(id, phase),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
    },
  });
};
