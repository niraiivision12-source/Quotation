"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTransactionSchema = exports.createPaymentSchema = void 0;
const zod_1 = require("zod");
exports.createPaymentSchema = zod_1.z.object({
    quotationId: zod_1.z.string().uuid("Invalid quotation ID"),
    billNumber: zod_1.z.string().min(1, "Bill Number is required"),
    billDate: zod_1.z.string().min(1, "Bill Date is required"),
    totalBillAmount: zod_1.z.coerce.number().positive("Total Bill Amount must be positive"),
    initialAmountReceived: zod_1.z.coerce.number().min(0, "Initial amount received cannot be negative").optional().default(0),
    allowCredit: zod_1.z.boolean().default(false),
    dueDate: zod_1.z.string().optional(),
    remarks: zod_1.z.string().optional(),
    collectorId: zod_1.z.string().uuid("Invalid collector ID").optional(),
});
exports.createTransactionSchema = zod_1.z.object({
    amount: zod_1.z.coerce.number().positive("Amount must be positive"),
    date: zod_1.z.string().min(1, "Date is required"),
    paymentMethod: zod_1.z.string().min(1, "Payment Method is required"),
    referenceNumber: zod_1.z.string().optional().nullable(),
    notes: zod_1.z.string().optional().nullable(),
});
//# sourceMappingURL=payment.validation.js.map