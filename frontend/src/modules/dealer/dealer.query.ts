import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDealer,
  getDealers,
  getDealer,
  updateDealer,
  deactivateDealer,
} from "./dealer.api";

export function useDealers(search = "") {
  return useQuery({
    queryKey: ["dealers", search],
    queryFn: () => getDealers(search),
  });
}

export function useDealer(id?: string) {
  return useQuery({
    queryKey: ["dealer", id],
    queryFn: () => getDealer(id!),
    enabled: !!id,
  });
}

export function useCreateDealer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createDealer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dealers"] });
    },
  });
}

export function useUpdateDealer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateDealer(id, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["dealers"] });
      qc.invalidateQueries({ queryKey: ["dealer", variables.id] });
    },
  });
}

export function useDeactivateDealer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deactivateDealer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dealers"] });
    },
  });
}
