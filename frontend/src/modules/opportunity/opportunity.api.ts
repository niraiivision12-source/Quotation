import { api } from "../../lib/axios";
import type { Opportunity, OpportunityListResponse } from "./opportunity.types";

export const getOpportunities = async (
  page = 1,
  limit = 20,
  search = "",
  filters?: {
    category?: string;
    status?: string;
  }
): Promise<OpportunityListResponse> => {
  const response = await api.get("/opportunities", {
    params: { page, limit, search, ...filters },
  });
  return response.data.data;
};

export const getOpportunityById = async (id: string): Promise<Opportunity> => {
  const response = await api.get(`/opportunities/${id}`);
  return response.data.data;
};

export const updateOpportunity = async (
  id: string,
  data: {
    status?: string;
    estimatedValue?: number | null;
    assignedToId?: string | null;
    nextFollowUpAt?: string | null;
    lostReason?: string | null;
    followUp?: {
      title?: string;
      description?: string;
      priority?: string;
      dueAt: Date;
    };
  }
): Promise<Opportunity> => {
  const response = await api.patch(`/opportunities/${id}`, data);
  return response.data.data;
};

export const getOpportunityStats = async (): Promise<any> => {
  const response = await api.get("/opportunities/stats");
  return response.data.data;
};

export const getOpportunityCounts = async (
  category?: string,
  search?: string
): Promise<Record<string, number>> => {
  const response = await api.get("/opportunities/counts", {
    params: { category, search },
  });
  return response.data.data;
};

export const deleteOpportunity = async (id: string): Promise<any> => {
  const response = await api.delete(`/opportunities/${id}`);
  return response.data;
};
