import { useQuery, useMutation } from "@tanstack/react-query";

import { queryClient } from "../../lib/query-client";

import { getLeads, getLeadById, createLead, updateLead } from "./lead.api";

export const useLeads = (page: number, search: string) => {
  return useQuery({
    queryKey: ["leads", page, search],
    queryFn: () => getLeads(page, 20, search),
  });
};

export const useAllLeads = () => {
  return useQuery({
    queryKey: ["leads", "all"],
    queryFn: () => getLeads(1, 10000, ""),
    staleTime: 5 * 60 * 1000,
  });
};

export const useLead = (id: string) => {
  return useQuery({
    queryKey: ["lead", id],
    queryFn: () => getLeadById(id),
    enabled: !!id,
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

export const useUpdateLead = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateLead(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead", variables.id] });
    },
  });
};
