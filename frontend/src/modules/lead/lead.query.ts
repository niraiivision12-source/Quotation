import { useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/lib/query-client";

import {
  convertLead,
  createLead,
  deleteLead,
  getLeadById,
  getLeadStats,
  getLeads,
  updateLead,
} from "./lead.api";

export const useLeads = (
  page: number,
  search: string,
  filters?: {
    source?: string;
    status?: string;
    assignedToId?: string;
    city?: string;
    dateFrom?: string;
    dateTo?: string;
    phase?: string;
  },
  limit = 20,
) => {
  return useQuery({
    queryKey: ["leads", page, search, filters, limit],
    queryFn: () => getLeads(page, limit, search, filters),
  });
};

export const useCreateLead = () => {
  return useMutation({
    mutationFn: createLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-stats"] });
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
      data: {
        projectName: string;
        location?: string;
        estimatedBudget?: number;
      };
    }) => convertLead(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-stats"] });
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
        createdAt?: string | null;
        assignedToId?: string | null;
        status?: string;
        nextFollowUpAt?: string | null;
      };
    }) => updateLead(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-stats"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
};

export const useLead = (id: string | null) => {
  return useQuery({
    queryKey: ["lead", id],
    queryFn: () => getLeadById(id!),
    enabled: !!id,
  });
};

export const useLeadStats = () => {
  return useQuery({
    queryKey: ["lead-stats"],
    queryFn: getLeadStats,
  });
};

export const useDeleteLead = () => {
  return useMutation({
    mutationFn: (id: string) => deleteLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-stats"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};
