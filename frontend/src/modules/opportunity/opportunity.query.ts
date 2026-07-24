import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "../../lib/query-client";
import {
  getOpportunities,
  getOpportunityById,
  getOpportunityStats,
  updateOpportunity,
} from "./opportunity.api";

export const useOpportunities = (
  page: number,
  search: string,
  filters?: {
    category?: string;
    status?: string;
  },
  limit = 100 // default large limit for pipeline kanban drag & drop sorting
) => {
  return useQuery({
    queryKey: ["opportunities", page, search, filters, limit],
    queryFn: () => getOpportunities(page, limit, search, filters),
  });
};

export const useOpportunity = (id: string | null) => {
  return useQuery({
    queryKey: ["opportunity", id],
    queryFn: () => getOpportunityById(id!),
    enabled: !!id,
  });
};

export const useUpdateOpportunity = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateOpportunity(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["opportunity", data.id] });
      queryClient.invalidateQueries({ queryKey: ["opportunity-stats"] });
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
};

export const useOpportunityStats = () => {
  return useQuery({
    queryKey: ["opportunity-stats"],
    queryFn: getOpportunityStats,
  });
};
