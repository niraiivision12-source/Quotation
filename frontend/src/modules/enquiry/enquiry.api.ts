import { api } from "../../lib/axios";
import type { Enquiry, EnquiryListResponse } from "./enquiry.types";

export const getEnquiries = async (
  page = 1,
  limit = 20,
  search = "",
  status?: string
): Promise<EnquiryListResponse> => {
  const response = await api.get("/enquiries", {
    params: { page, limit, search, status },
  });
  return response.data.data;
};

export const createEnquiry = async (data: {
  name: string;
  mobile: string;
  email?: string | null;
  source?: string;
  message?: string | null;
  city?: string | null;
}): Promise<Enquiry> => {
  const response = await api.post("/enquiries", data);
  return response.data.data;
};

export const triageEnquiry = async (
  id: string,
  category: string,
  notes?: string
): Promise<{ enquiry: Enquiry; customer: any; opportunity: any }> => {
  const response = await api.post(`/enquiries/${id}/triage`, { category, notes: notes || null });
  return response.data.data;
};

export const ignoreEnquiry = async (id: string): Promise<Enquiry> => {
  const response = await api.post(`/enquiries/${id}/ignore`);
  return response.data.data;
};
