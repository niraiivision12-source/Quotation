import { z } from "zod";

export const createPaymentSchema = z.object({
  quotationId: z.string().uuid("Invalid quotation ID"),
  billNumber: z.string().min(1, "Bill Number is required"),
  billDate: z.string().min(1, "Bill Date is required"),
  totalBillAmount: z.coerce.number().positive("Total Bill Amount must be positive"),
  initialAmountReceived: z.coerce.number().min(0, "Initial amount received cannot be negative").optional().default(0),
  allowCredit: z.boolean().default(false),
  dueDate: z.string().optional(),
  remarks: z.string().optional(),
  collectorId: z.string().uuid("Invalid collector ID").optional(),
});

export const createTransactionSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  date: z.string().min(1, "Date is required"),
  paymentMethod: z.string().min(1, "Payment Method is required"),
  referenceNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
