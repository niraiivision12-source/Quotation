import { api } from "../../lib/axios";
import type { CreatePurchaseOrderDTO, PurchaseOrder } from "./purchase-order.types";

export const createPurchaseOrder = async (data: CreatePurchaseOrderDTO): Promise<PurchaseOrder> => {
  const response = await api.post("/purchase-orders", data);
  return response.data.data;
};

export const getPurchaseOrders = async (page = 1, limit = 20, search = ""): Promise<{ items: PurchaseOrder[]; total: number }> => {
  const response = await api.get("/purchase-orders", {
    params: {
      page,
      limit,
      search,
    },
  });
  return response.data.data;
};

export const getPurchaseOrder = async (id: string): Promise<PurchaseOrder> => {
  const response = await api.get(`/purchase-orders/${id}`);
  return response.data.data;
};

export const updatePurchaseOrderStatus = async (id: string, status: string): Promise<PurchaseOrder> => {
  const response = await api.patch(`/purchase-orders/${id}/status`, { status });
  return response.data.data;
};

export const updatePurchaseOrder = async (id: string, data: any): Promise<PurchaseOrder> => {
  const response = await api.put(`/purchase-orders/${id}`, data);
  return response.data.data;
};

export const deletePurchaseOrder = async (id: string): Promise<void> => {
  await api.delete(`/purchase-orders/${id}`);
};

export const createPurchaseOrderRevision = async (id: string, revisionReason: string): Promise<PurchaseOrder> => {
  const response = await api.post(`/purchase-orders/${id}/revision`, { revisionReason });
  return response.data.data;
};

export const getPurchaseOrderHistory = async (id: string): Promise<PurchaseOrder[]> => {
  const response = await api.get(`/purchase-orders/${id}/history`);
  return response.data.data;
};
