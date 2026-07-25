import { api } from "../../lib/axios";

import type { Lead, LeadListResponse } from "./lead.types";

export const getLeads = async (
  page = 1,
  limit = 20,
  search = "",
): Promise<LeadListResponse> => {
  const response = await api.get("/leads", {
    params: {
      page,
      limit,
      search,
    },
  });

  return response.data.data;
};

export const getLeadById = async (id: string): Promise<Lead> => {
  const response = await api.get(`/leads/${id}`);

  return response.data.data;
};

export const createLead = async (data: {
  name: string;
  mobile: string;
  email?: string;
  city?: string;
  source?: string;
  notes?: string;
  assignedToId?: string;
}) => {
  const response = await api.post("/leads", data);

  return response.data;
};

export const updateLead = async (id: string, data: Partial<Lead>) => {
  const response = await api.patch(`/leads/${id}`, data);

  return response.data;
};
