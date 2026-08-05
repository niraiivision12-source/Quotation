import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "../../lib/query-client";
import {
  createEnquiry,
  getEnquiries,
  ignoreEnquiry,
  triageEnquiry,
  deleteEnquiry,
  updateEnquiry,
  restoreEnquiry,
  bulkDeleteEnquiries,
  bulkIgnoreEnquiries,
} from "./enquiry.api";

export const useEnquiries = (
  page: number,
  search: string,
  status?: string,
  limit = 20
) => {
  return useQuery({
    queryKey: ["enquiries", page, search, status, limit],
    queryFn: () => getEnquiries(page, limit, search, status),
  });
};

export const useCreateEnquiry = () => {
  return useMutation({
    mutationFn: createEnquiry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enquiries"] });
    },
  });
};

export const useTriageEnquiry = () => {
  return useMutation({
    mutationFn: ({ id, category, notes, projectName }: { id: string; category: string; notes?: string; projectName?: string }) =>
      triageEnquiry(id, category, notes, projectName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enquiries"] });
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
};

export const useIgnoreEnquiry = () => {
  return useMutation({
    mutationFn: ignoreEnquiry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enquiries"] });
    },
  });
};

// ─── New: Delete (permanent) ────────────────────────────────────────────────
export const useDeleteEnquiry = () => {
  return useMutation({
    mutationFn: deleteEnquiry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enquiries"] });
    },
  });
};

// ─── New: Update (PENDING only) ─────────────────────────────────────────────
export const useUpdateEnquiry = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateEnquiry>[1] }) =>
      updateEnquiry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enquiries"] });
    },
  });
};

// ─── New: Restore IGNORED → PENDING ─────────────────────────────────────────
export const useRestoreEnquiry = () => {
  return useMutation({
    mutationFn: restoreEnquiry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enquiries"] });
    },
  });
};

// ─── New: Bulk Delete ────────────────────────────────────────────────────────
export const useBulkDeleteEnquiries = () => {
  return useMutation({
    mutationFn: bulkDeleteEnquiries,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enquiries"] });
    },
  });
};

// ─── New: Bulk Ignore ────────────────────────────────────────────────────────
export const useBulkIgnoreEnquiries = () => {
  return useMutation({
    mutationFn: bulkIgnoreEnquiries,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enquiries"] });
    },
  });
};
