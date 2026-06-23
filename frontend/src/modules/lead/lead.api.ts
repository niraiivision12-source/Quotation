import { api } from "@/lib/axios";

import type { Lead, LeadListResponse } from "./lead.types";

export const getLeads = async (
  page = 1,
  limit = 20,
  search = "",
  filters?: {
    source?: string;
    status?: string;
    assignedToId?: string;
    city?: string;
  },
): Promise<LeadListResponse> => {
  const response = await api.get("/leads", {
    params: { page, limit, search, ...filters },
  });

  return response.data.data;
};

export const convertLead = async (
  id: string,
  data: { projectName: string; location?: string; estimatedBudget?: number },
) => {
  const response = await api.post(`/leads/${id}/convert`, data);
  return response.data;
};

export const updateLead = async (
  id: string,
  data: {
    name?: string;
    mobile?: string;
    email?: string | null;
    city?: string | null;
    source?: string | null;
    notes?: string | null;
    referralDate?: string | null;
    assignedToId?: string | null;
    status?: string;
    nextFollowUpAt?: string | null;
  },
) => {
  const response = await api.patch(`/leads/${id}`, data);
  return response.data;
};

export const createLead = async (data: {
  name: string;
  mobile: string;
  email?: string;
  source?: string;
  notes?: string;
  assignedToId?: string;
  city?: string;
}) => {
  const response = await api.post("/leads", data);

  return response.data;
};

export const deleteLead = async (id: string) => {
  const response = await api.patch(`/leads/${id}/deactivate`);
  return response.data;
};

export const getLeadById = async (id: string): Promise<Lead> => {
  const response = await api.get(`/leads/${id}`);

  return response.data.data;
};

export const getLeadStats = async (): Promise<{
  total: number;
  followUp: number;
  won: number;
  lost: number;
  todayFollowUp: number;
}> => {
  const response = await api.get("/leads/stats");
  return response.data.data;
};
