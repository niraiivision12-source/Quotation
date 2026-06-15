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

export const createLead = async (data: {
  name: string;
  mobile: string;
  email?: string;
  source?: string;
  notes?: string;
  contactOwner?: string;
  city?: string;
  referralDate?: string;
}) => {
  const response = await api.post("/leads", data);

  return response.data;
};
