import { api } from "@/lib/axios";

import type { CreateQuotationDTO, Quotation } from "./quotation.types";

export const createQuotation = async (data: CreateQuotationDTO) => {
  const response = await api.post("/quotations", data);

  return response.data.data;
};

export const getQuotations = async (page = 1, limit = 20) => {
  const response = await api.get("/quotations", {
    params: {
      page,
      limit,
    },
  });

  return response.data.data;
};

export const getQuotation = async (id: string): Promise<Quotation> => {
  const response = await api.get(`/quotations/${id}`);

  return response.data.data;
};

export const updateQuotationStatus = async (id: string, status: string) => {
  const response = await api.patch(`/quotations/${id}/status`, { status });

  return response.data.data;
};

export const createRevision = async (id: string, revisionReason: string) => {
  const response = await api.post(`/quotations/${id}/revision`, {
    revisionReason,
  });

  return response.data.data;
};

export const getCustomers = async (search = "") => {
  const response = await api.get("/customers", {
    params: {
      page: 1,
      limit: 20,
      search,
    },
  });

  return response.data.data;
};

export const getProjects = async (customerId: string) => {
  const response = await api.get("/projects", {
    params: {
      page: 1,
      limit: 100,
      customerId,
    },
  });

  return response.data.data;
};

export const getLeads = async (search = "") => {
  const response = await api.get("/leads", {
    params: {
      page: 1,
      limit: 20,
      search,
    },
  });

  return response.data.data;
};
