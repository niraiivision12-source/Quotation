import { api } from "@/lib/axios";

import type { LeadListResponse } from "./lead.types";

export const getLeads = async (
  page = 1,
  limit = 20,
  search = "",
): Promise<LeadListResponse> => {
  const response = await api.get("/leads", {
    params: { page, limit, search },
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

export const updateLead = async (id: string, data: { contactOwnerId?: string | null }) => {
  const response = await api.patch(`/leads/${id}`, data);
  return response.data;
};

export const createLead = async (data: {
  name: string;
  mobile: string;
  email?: string;
  source?: string;
  notes?: string;
  contactOwnerId?: string;
  city?: string;
  referralDate?: string;
}) => {
  const response = await api.post("/leads", data);

  return response.data;
};
