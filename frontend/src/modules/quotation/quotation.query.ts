import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createQuotation,
  createRevision,
  getQuotation,
  getQuotationHistory,
  getQuotations,
  updateQuotationStatus,
  getProjectQuotations,
} from "./quotation.api";

export function useQuotations(page = 1, limit = 20) {
  return useQuery({
    queryKey: ["quotations", page],
    queryFn: () => getQuotations(page, limit),
  });
}

export function useQuotation(id?: string) {
  return useQuery({
    queryKey: ["quotation", id],
    queryFn: () => getQuotation(id!),
    enabled: !!id,
  });
}

export function useQuotationHistory(id?: string) {
  return useQuery({
    queryKey: ["quotation", id, "history"],
    queryFn: () => getQuotationHistory(id!),
    enabled: !!id,
  });
}


export function useCreateQuotation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createQuotation,

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["quotations"],
      });
    },
  });
}

export function useUpdateQuotationStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateQuotationStatus(id, status),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotations"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["project"] });
    },
  });
}

export function useCreateRevision() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      createRevision(id, reason),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotations"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["project"] });
    },
  });
}

export function useProjectQuotations(projectId: string) {
  return useQuery({
    queryKey: ["quotations", "project", projectId],
    queryFn: () => getProjectQuotations(projectId),
    enabled: !!projectId,
  });
}
