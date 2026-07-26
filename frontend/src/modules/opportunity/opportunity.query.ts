import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "../../lib/query-client";
import {
  getOpportunities,
  getOpportunityById,
  getOpportunityCounts,
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

// Per-column paginated fetch for a single pipeline stage, so a stage with
// thousands of opportunities loads in small pages instead of all at once.
const PIPELINE_COLUMN_PAGE_SIZE = 25;

export const useOpportunitiesByStatus = (
  category: string,
  status: string,
  search: string
) => {
  return useInfiniteQuery({
    queryKey: ["opportunities-by-status", category, status, search],
    queryFn: ({ pageParam }) =>
      getOpportunities(pageParam, PIPELINE_COLUMN_PAGE_SIZE, search, {
        category,
        status,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.page * lastPage.limit;
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
  });
};

export const useOpportunityCounts = (category: string, search: string) => {
  return useQuery({
    queryKey: ["opportunity-counts", category, search],
    queryFn: () => getOpportunityCounts(category, search),
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
      queryClient.invalidateQueries({ queryKey: ["opportunities-by-status"] });
      queryClient.invalidateQueries({ queryKey: ["opportunity-counts"] });
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
