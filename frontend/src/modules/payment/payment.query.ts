import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "../../lib/query-client";
import {
  getPayments,
  getPaymentById,
  linkBill,
  recordTransaction,
  cancelPayment,
} from "./payment.api";
import type { CreatePaymentDTO, CreateTransactionDTO } from "./payment.types";

export const usePayments = (params?: any) => {
  return useQuery({
    queryKey: ["payments", params],
    queryFn: () => getPayments(params),
  });
};

export const usePayment = (id: string) => {
  return useQuery({
    queryKey: ["payment", id],
    queryFn: () => getPaymentById(id),
    enabled: !!id,
  });
};

export const useLinkBill = () => {
  return useMutation({
    mutationFn: (data: CreatePaymentDTO) => linkBill(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["quotation", variables.quotationId] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
      queryClient.invalidateQueries({ queryKey: ["customer"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
    },
  });
};

export const useRecordTransaction = () => {
  return useMutation({
    mutationFn: ({ paymentId, data }: { paymentId: string; data: CreateTransactionDTO }) =>
      recordTransaction(paymentId, data),
    onSuccess: (res) => {
      const paymentId = res.payment?.id || res.id;
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["payment", paymentId] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
      queryClient.invalidateQueries({ queryKey: ["customer"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
    },
  });
};

export const useCancelPayment = () => {
  return useMutation({
    mutationFn: (paymentId: string) => cancelPayment(paymentId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["payment", data.id] });
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
      queryClient.invalidateQueries({ queryKey: ["customer"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
    },
  });
};
