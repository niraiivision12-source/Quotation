export type PaymentStatus = "PENDING" | "PARTIALLY_PAID" | "FULLY_PAID" | "OVERDUE" | "CANCELLED";

export interface Payment {
  id: string;
  customerId: string;
  projectId: string;
  quotationId: string;
  salesmanId: string;
  accountantId?: string | null;
  collectorId: string;
  billNumber: string;
  billDate: string;
  totalBillAmount: number;
  amountReceived: number;
  pendingAmount: number;
  status: PaymentStatus;
  dueDate: string;
  creditPeriod: number;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;

  customer?: {
    id: string;
    name: string;
    mobile: string;
    creditAllowed: boolean;
    maxCreditAmount?: number;
    defaultCreditDays?: number;
  };
  project?: { id: string; projectName: string };
  quotation?: { id: string; quotationNumber: string };
  collector?: { id: string; name: string; role: string };
  salesman?: { id: string; name: string };
  accountant?: { id: string; name: string } | null;
  transactions?: PaymentTransaction[];
}

export interface PaymentTransaction {
  id: string;
  paymentId: string;
  date: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string | null;
  notes?: string | null;
  updatedById: string;
  createdAt: string;
  updatedAt: string;
  updatedBy?: { id: string; name: string };
}

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
