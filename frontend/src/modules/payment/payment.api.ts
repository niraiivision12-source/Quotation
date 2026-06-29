import { api } from "@/lib/axios";
import type { CreatePaymentDTO, CreateTransactionDTO } from "./payment.types";

export const getPayments = async (params?: any) => {
  const response = await api.get("/payments", { params });
  return response.data;
};

export const getPaymentById = async (id: string) => {
  const response = await api.get(`/payments/${id}`);
  return response.data.data;
};

export const linkBill = async (data: CreatePaymentDTO) => {
  const response = await api.post("/payments/link-bill", data);
  return response.data.data;
};

export const recordTransaction = async (paymentId: string, data: CreateTransactionDTO) => {
  const response = await api.post(`/payments/${paymentId}/transactions`, data);
  return response.data.data;
};

export const cancelPayment = async (paymentId: string) => {
  const response = await api.post(`/payments/${paymentId}/cancel`);
  return response.data.data;
};
