import { useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/lib/query-client";

import { createLead, getLeads, updateLead } from "./lead.api";

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

export const useUpdateLead = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { contactOwnerId?: string | null } }) =>
      updateLead(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
};
