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

export const checkEnquiryMobile = async (
  mobile: string
): Promise<{ exists: boolean; message?: string; existingId?: string; existingName?: string; existingStatus?: string }> => {
  const response = await api.get("/enquiries/check-mobile", {
    params: { mobile },
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

// ─── New: Delete (permanent) ────────────────────────────────────────────────
export const deleteEnquiry = async (id: string): Promise<void> => {
  await api.delete(`/enquiries/${id}`);
};

// ─── New: Update (PENDING only) ─────────────────────────────────────────────
export const updateEnquiry = async (
  id: string,
  data: {
    name?: string;
    email?: string | null;
    city?: string | null;
    message?: string | null;
    source?: string;
  }
): Promise<Enquiry> => {
  const response = await api.patch(`/enquiries/${id}`, data);
  return response.data.data;
};

// ─── New: Restore IGNORED → PENDING ─────────────────────────────────────────
export const restoreEnquiry = async (id: string): Promise<Enquiry> => {
  const response = await api.post(`/enquiries/${id}/restore`);
  return response.data.data;
};

// ─── New: Bulk Delete ────────────────────────────────────────────────────────
export const bulkDeleteEnquiries = async (ids: string[]): Promise<{ deleted: number }> => {
  const response = await api.post("/enquiries/bulk-delete", { ids });
  return response.data.data;
};

// ─── New: Bulk Ignore ────────────────────────────────────────────────────────
export const bulkIgnoreEnquiries = async (ids: string[]): Promise<{ ignored: number }> => {
  const response = await api.post("/enquiries/bulk-ignore", { ids });
  return response.data.data;
};

// ─── New: Export CSV ─────────────────────────────────────────────────────────
export const exportEnquiriesCSV = async (params?: {
  search?: string;
  status?: string;
}): Promise<Blob> => {
  const response = await api.get("/enquiries/export", {
    params,
    responseType: "blob",
  });
  return response.data;
};
