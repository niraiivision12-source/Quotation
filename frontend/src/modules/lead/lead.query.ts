import { useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/lib/query-client";

import { convertLead, createLead, deleteLead, getLeadLifecycle, getLeads, updateLead } from "./lead.api";

export const useLeads = (page: number, search: string) => {
  return useQuery({
    queryKey: ["leads", page, search],
    queryFn: () => getLeads(page, 20, search),
  });
};

export const useCreateLead = () => {
  return useMutation({
    mutationFn: createLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
};

export const useConvertLead = () => {
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { projectName: string; location?: string; estimatedBudget?: number };
    }) => convertLead(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};

export const useUpdateLead = () => {
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        name?: string;
        mobile?: string;
        email?: string | null;
        city?: string | null;
        source?: string | null;
        notes?: string | null;
        referralDate?: string | null;
        contactOwnerId?: string | null;
        status?: string;
      };
    }) => updateLead(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
};

export const useLeadLifecycle = (id: string | null) => {
  return useQuery({
    queryKey: ["lead-lifecycle", id],
    queryFn: () => getLeadLifecycle(id!),
    enabled: !!id,
  });
};

export const useDeleteLead = () => {
  return useMutation({
    mutationFn: (id: string) => deleteLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};
