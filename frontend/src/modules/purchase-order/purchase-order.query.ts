import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrder,
  updatePurchaseOrderStatus,
  createPurchaseOrderRevision,
  getPurchaseOrderHistory,
  updatePurchaseOrder,
  deletePurchaseOrder,
} from "./purchase-order.api";

export function usePurchaseOrders(page = 1, limit = 20, search = "") {
  return useQuery({
    queryKey: ["purchase-orders", page, search],
    queryFn: () => getPurchaseOrders(page, limit, search),
  });
}

export function usePurchaseOrder(id?: string) {
  return useQuery({
    queryKey: ["purchase-order", id],
    queryFn: () => getPurchaseOrder(id!),
    enabled: !!id,
  });
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPurchaseOrder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
    },
  });
}

export function useUpdatePurchaseOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updatePurchaseOrderStatus(id, status),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
      qc.invalidateQueries({ queryKey: ["purchase-order", variables.id] });
    },
  });
}

export function useCreatePurchaseOrderRevision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      createPurchaseOrderRevision(id, reason),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
      qc.invalidateQueries({ queryKey: ["purchase-order", variables.id] });
    },
  });
}

export function usePurchaseOrderHistory(id?: string) {
  return useQuery({
    queryKey: ["purchase-order", id, "history"],
    queryFn: () => getPurchaseOrderHistory(id!),
    enabled: !!id,
  });
}

export function useUpdatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updatePurchaseOrder(id, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
      qc.invalidateQueries({ queryKey: ["purchase-order", variables.id] });
    },
  });
}

export function useDeletePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePurchaseOrder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
    },
  });
}
