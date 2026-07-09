import { useState, useEffect, startTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CalendarRange, CheckCircle2, ShieldAlert } from "lucide-react";
import { api } from "@/lib/axios";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: {
    id: string;
    projectName: string;
    customer: {
      id: string;
      name: string;
      mobile: string;
      creditAllowed: boolean;
      maxCreditAmount?: string | number;
      defaultCreditDays?: number;
    };
  };
  latestApprovedQuotation: {
    id: string;
    quotationNumber: string;
    totalAmount: string | number;
  };
  onConfirm: (paymentData: any) => void;
  onCancel: () => void;
}

type PaymentOption = "FULL" | "PARTIAL" | "CREDIT";

export default function AddPaymentPopup({
  open,
  onOpenChange,
  project,
  latestApprovedQuotation,
  onConfirm,
  onCancel,
}: Props) {
  const [billNumber, setBillNumber] = useState("");
  const [billDate, setBillDate] = useState(new Date().toISOString().split("T")[0]);
  const [totalBillAmount, setTotalBillAmount] = useState(Number(latestApprovedQuotation.totalAmount));
  const [paymentOption, setPaymentOption] = useState<PaymentOption>("FULL");
  const [amountReceived, setAmountReceived] = useState(Number(latestApprovedQuotation.totalAmount));
  const [dueDate, setDueDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [defaultCreditDays, setDefaultCreditDays] = useState(30);

  const customer = project.customer;

  // Load settings for default credit days
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await api.get("/settings");
        if (res.data?.success && res.data?.data) {
          setDefaultCreditDays(Number(res.data.data.paymentDefaultCreditDays || 30));
        }
      } catch (err) {
        console.error("Failed to load settings credit days", err);
      }
    }
    if (open) {
      fetchSettings();
    }
  }, [open]);

  // Set default values when popup opens or inputs change
  useEffect(() => {
    if (open && latestApprovedQuotation) {
      const billAmt = Number(latestApprovedQuotation.totalAmount);
      const creditDays = customer.defaultCreditDays || defaultCreditDays;
      const today = new Date();
      const calculatedDueDate = new Date(today.getTime() + creditDays * 24 * 60 * 60 * 1000);

      startTransition(() => {
        setBillNumber("");
        setBillDate(new Date().toISOString().split("T")[0]);
        setTotalBillAmount(billAmt);
        setRemarks("");
        setPaymentOption("FULL");
        setAmountReceived(billAmt);
        setDueDate(calculatedDueDate.toISOString().split("T")[0]);
      });
    }
  }, [open, latestApprovedQuotation, customer, defaultCreditDays]);

  // Handle switching payment options
  const handlePaymentOptionChange = (option: PaymentOption) => {
    setPaymentOption(option);
    const todayStr = new Date().toISOString().split("T")[0];
    const creditDays = customer.defaultCreditDays || defaultCreditDays;
    const calculatedDueDate = new Date(new Date().getTime() + creditDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    if (option === "FULL") {
      setAmountReceived(totalBillAmount);
      setDueDate(todayStr);
    } else if (option === "PARTIAL") {
      setAmountReceived(Math.round(totalBillAmount / 2));
      setDueDate(calculatedDueDate);
    } else if (option === "CREDIT") {
      setAmountReceived(0);
      setDueDate(calculatedDueDate);
    }
  };

  const pendingAmount = Math.max(0, totalBillAmount - amountReceived);

  // Validate limits
  const exceedsLimit = !!(
    paymentOption !== "FULL" &&
    customer.maxCreditAmount &&
    Number(customer.maxCreditAmount) > 0 &&
    pendingAmount > Number(customer.maxCreditAmount)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (totalBillAmount <= 0) {
      toast.error("Total Bill Amount must be greater than 0");
      return;
    }

    if (paymentOption === "FULL" && pendingAmount > 0) {
      toast.error("Full Payment cannot have a pending amount");
      return;
    }

    if (paymentOption === "PARTIAL" && amountReceived > totalBillAmount) {
      toast.error("Partial Payment amount cannot exceed the bill amount");
      return;
    }

    if (paymentOption === "PARTIAL" && amountReceived <= 0) {
      toast.error("Amount Received is required for Partial Payment");
      return;
    }

    if (paymentOption !== "FULL" && pendingAmount > 0 && !customer.creditAllowed) {
      toast.error(`Outstanding balance is not allowed. Customer '${customer.name}' does not allow credit.`);
      return;
    }

    if (exceedsLimit) {
      toast.error(
        `Pending amount ₹${pendingAmount.toLocaleString()} exceeds customer credit limit of ₹${Number(
          customer.maxCreditAmount
        ).toLocaleString()}`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const paymentData = {
        quotationId: latestApprovedQuotation.id,
        billNumber: billNumber.trim() || undefined,
        billDate,
        totalBillAmount,
        initialAmountReceived: amountReceived,
        allowCredit: paymentOption !== "FULL",
        dueDate: paymentOption !== "FULL" ? dueDate : undefined,
        remarks,
        paymentMethod: "CASH",
      };
      await onConfirm(paymentData);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to submit payment details");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelClick = () => {
    onCancel();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleCancelClick(); }}>
      <DialogContent className="max-w-md p-6 rounded-2xl border bg-white shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <DialogHeader className="border-b pb-3 mb-4">
          <DialogTitle className="text-lg font-bold tracking-tight text-gray-900">
            Add Payment (Closing Project)
          </DialogTitle>
          <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
            <p>Project: <strong className="text-gray-900">{project.projectName}</strong></p>
            <p>Customer: <strong className="text-gray-900">{customer.name}</strong></p>
            <p>Quotation: <strong className="text-gray-900">{latestApprovedQuotation.quotationNumber}</strong></p>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Bill Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-800 uppercase tracking-wider">
                Tally Bill Number (Optional)
              </label>
              <Input
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                placeholder="e.g. BILL-2026-001"
                className="h-9 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-800 uppercase tracking-wider">
                Bill Date
              </label>
              <Input
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                className="h-9 text-sm"
                required
              />
            </div>
          </div>

          {/* Bill Amount */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-800 uppercase tracking-wider">
              Bill Amount (₹)
            </label>
            <Input
              type="number"
              value={totalBillAmount}
              onChange={(e) => {
                const val = Number(e.target.value);
                setTotalBillAmount(val);
                if (paymentOption === "FULL") {
                  setAmountReceived(val);
                } else if (paymentOption === "CREDIT") {
                  setAmountReceived(0);
                }
              }}
              className="h-9 text-sm font-medium"
              required
            />
          </div>

          {/* Payment Option Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-800 uppercase tracking-wider">
              Payment Option
            </label>
            <div className="flex bg-slate-100 p-0.5 rounded-lg h-9 border items-center">
              <button
                type="button"
                onClick={() => handlePaymentOptionChange("FULL")}
                className={`flex-1 text-center py-1 text-xs font-semibold rounded-md transition-all ${
                  paymentOption === "FULL" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Full Payment
              </button>
              <button
                type="button"
                onClick={() => handlePaymentOptionChange("PARTIAL")}
                className={`flex-1 text-center py-1 text-xs font-semibold rounded-md transition-all ${
                  paymentOption === "PARTIAL" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Partial Payment
              </button>
              <button
                type="button"
                onClick={() => handlePaymentOptionChange("CREDIT")}
                className={`flex-1 text-center py-1 text-xs font-semibold rounded-md transition-all ${
                  paymentOption === "CREDIT" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Credit / Pending
              </button>
            </div>
          </div>

          {/* Customer Credit Allow warning */}
          {paymentOption !== "FULL" && !customer.creditAllowed && (
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
              <ShieldAlert size={14} className="shrink-0 text-amber-600 mt-0.5" />
              <div>
                <span className="font-bold">Credit Control Active:</span> This customer is not configured to allow
                credit. Outstanding balances cannot be saved.
              </div>
            </div>
          )}

          {/* Full Payment Info Display */}
          {paymentOption === "FULL" && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
              <span>Full amount of ₹{totalBillAmount.toLocaleString()} will be marked as paid.</span>
            </div>
          )}

          {/* Partial & Credit Payment Section */}
          {paymentOption !== "FULL" && (
            <div className="space-y-4 border rounded-2xl p-4 bg-slate-50 border-gray-100 animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-2 gap-4">
                {/* Amount Received */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wide">
                    Amount Received (₹)
                  </label>
                  <Input
                    type="number"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(Number(e.target.value))}
                    max={totalBillAmount}
                    disabled={paymentOption === "CREDIT"}
                    className="h-8 text-xs bg-white"
                    required
                  />
                </div>

                {/* Remaining Amount */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wide">
                    Pending Amount
                  </label>
                  <div className="h-8 px-3 border border-gray-200 bg-gray-100 rounded-lg flex items-center text-xs font-bold text-gray-800">
                    ₹{pendingAmount.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Due Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1">
                  <CalendarRange size={12} className="text-gray-500" />
                  Due Date
                </label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-8 text-xs bg-white"
                  required
                />
              </div>

              {/* Remarks */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wide">
                  Remarks / Notes (Optional)
                </label>
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Discussed payment terms with customer."
                  className="text-xs bg-white resize-none"
                  rows={2}
                />
              </div>

              {/* Credit Limit Warnings */}
              {exceedsLimit && (
                <div className="flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-[11px] text-rose-800">
                  <AlertCircle size={14} className="shrink-0 text-rose-600 mt-0.5" />
                  <div>
                    <span className="font-bold">Limit Exceeded:</span> Outstanding balance of ₹
                    {pendingAmount.toLocaleString()} exceeds customer's max credit limit of ₹
                    {Number(customer.maxCreditAmount).toLocaleString()}!
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-2 border-t pt-3 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelClick}
              className="h-9 text-xs"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || exceedsLimit || (paymentOption !== "FULL" && !customer.creditAllowed)}
              className="h-9 text-xs bg-black text-white hover:bg-zinc-800"
            >
              {isSubmitting ? "Saving..." : "Save Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
