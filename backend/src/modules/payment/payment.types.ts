import { PaymentStatus } from "@prisma/client";

export interface CreatePaymentDTO {
  quotationId: string;
  billNumber: string;
  billDate: string;
  totalBillAmount: number;
  initialAmountReceived?: number;
  allowCredit: boolean;
  dueDate?: string;
  remarks?: string;
  collectorId?: string;
}

export interface CreateTransactionDTO {
  amount: number;
  date: string;
  paymentMethod: string;
  referenceNumber?: string | null;
  notes?: string | null;
}

export interface PaymentFilterQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: PaymentStatus;
  customerId?: string;
  opportunityId?: string;
  salesmanId?: string;
  collectorId?: string;
}
