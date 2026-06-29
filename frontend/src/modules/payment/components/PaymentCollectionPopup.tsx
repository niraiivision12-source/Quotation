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
import { useLinkBill } from "../payment.query";
import { AlertCircle, CalendarRange, CheckCircle2, ShieldAlert } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation: {
    id: string;
    quotationNumber: string;
    totalAmount: number;
    customer?: {
      id: string;
      name: string;
      mobile: string;
      creditAllowed: boolean;
      maxCreditAmount?: number;
      defaultCreditDays?: number;
    };
  } | null;
  onConfirm?: () => void;
}

export default function PaymentCollectionPopup({ open, onOpenChange, quotation, onConfirm }: Props) {
  const linkBillMutation = useLinkBill();

  const [billNumber, setBillNumber] = useState("");
  const [billDate, setBillDate] = useState(new Date().toISOString().split("T")[0]);
  const [totalBillAmount, setTotalBillAmount] = useState(0);
  const [initialAmountReceived, setInitialAmountReceived] = useState(0);
  const [allowCredit, setAllowCredit] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [remarks, setRemarks] = useState("");

  const customer = quotation?.customer;

  // Initialize fields on open
  useEffect(() => {
    if (quotation) {
      const creditDays = customer?.defaultCreditDays || 30;
      const calculatedDueDate = new Date();
      calculatedDueDate.setDate(calculatedDueDate.getDate() + creditDays);
      startTransition(() => {
        setBillNumber("");
        setBillDate(new Date().toISOString().split("T")[0]);
        setTotalBillAmount(Number(quotation.totalAmount));
        setInitialAmountReceived(Number(quotation.totalAmount));
        setAllowCredit(false);
        setRemarks("");
        setDueDate(calculatedDueDate.toISOString().split("T")[0]);
      });
    }
  }, [quotation, customer]);

  if (!quotation) return null;

  // Recalculate amount if credit toggle changes
  const handleCreditChange = (val: boolean) => {
    if (!customer?.creditAllowed && val) {
      toast.error(`Credit is not allowed for customer '${customer?.name}'`);
      return;
    }
    setAllowCredit(val);
    if (!val) {
      // If credit is disabled, customer must pay in full
      setInitialAmountReceived(totalBillAmount);
    } else {
      // Default to 0 received when credit is enabled
      setInitialAmountReceived(0);
    }
  };

  const remainingAmount = Math.max(0, totalBillAmount - initialAmountReceived);

  // Validate limits
  const exceedsLimit = !!(
    allowCredit &&
    customer?.maxCreditAmount &&
    Number(customer.maxCreditAmount) > 0 &&
    remainingAmount > Number(customer.maxCreditAmount)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!billNumber.trim()) {
      toast.error("Tally Bill Number is required");
      return;
    }

    if (totalBillAmount <= 0) {
      toast.error("Total Bill Amount must be greater than 0");
      return;
    }

    if (allowCredit && remainingAmount > 0 && !customer?.creditAllowed) {
      toast.error("Outstanding balance not allowed. Customer does not have credit permissions.");
      return;
    }

    if (exceedsLimit) {
      toast.error(
        `Pending amount ₹${remainingAmount.toLocaleString()} exceeds customer credit limit of ₹${Number(
          customer?.maxCreditAmount
        ).toLocaleString()}`
      );
      return;
    }

    try {
      await linkBillMutation.mutateAsync({
        quotationId: quotation.id,
        billNumber,
        billDate,
        totalBillAmount,
        initialAmountReceived: initialAmountReceived,
        allowCredit,
        dueDate: allowCredit ? dueDate : undefined,
        remarks,
      });

      toast.success("Tally Bill linked successfully!");
      onOpenChange(false);
      onConfirm?.();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to link Tally Bill");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 rounded-2xl border bg-white shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <DialogHeader className="border-b pb-3 mb-4">
          <DialogTitle className="text-lg font-bold tracking-tight text-gray-900">
            Link Tally Bill & Update Payment
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Quotation: <strong className="text-gray-900">{quotation.quotationNumber}</strong> · Customer:{" "}
            <strong className="text-gray-900">{customer?.name}</strong>
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Bill Number */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-800 uppercase tracking-wider">
                Tally Bill Number
              </label>
              <Input
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                placeholder="e.g. BILL-2026-001"
                className="h-9 text-sm"
                required
              />
            </div>

            {/* Bill Date */}
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

          <div className="grid grid-cols-2 gap-4">
            {/* Total Bill Amount */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-800 uppercase tracking-wider">
                Total Bill Amount (₹)
              </label>
              <Input
                type="number"
                value={totalBillAmount}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setTotalBillAmount(val);
                  if (!allowCredit) {
                    setInitialAmountReceived(val);
                  }
                }}
                className="h-9 text-sm font-medium"
                required
              />
            </div>

            {/* Allow Credit Toggle */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-800 uppercase tracking-wider">
                Allow Credit?
              </label>
              <div className="flex bg-slate-100 p-0.5 rounded-lg h-9 border items-center">
                <button
                  type="button"
                  onClick={() => handleCreditChange(false)}
                  className={`flex-1 text-center py-1 text-xs font-semibold rounded-md transition-all ${
                    !allowCredit ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  No
                </button>
                <button
                  type="button"
                  disabled={!customer?.creditAllowed}
                  onClick={() => handleCreditChange(true)}
                  className={`flex-1 text-center py-1 text-xs font-semibold rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                    allowCredit ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Yes
                </button>
              </div>
            </div>
          </div>

          {/* Credit Controls Warning */}
          {!customer?.creditAllowed && (
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
              <ShieldAlert size={14} className="shrink-0 text-amber-600 mt-0.5" />
              <div>
                <span className="font-bold">Credit Control Active:</span> This customer is not configured to allow
                credit. Payments must be fully paid.
              </div>
            </div>
          )}

          {/* Allow Credit = No fields */}
          {!allowCredit && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
              <span>Full amount of ₹{totalBillAmount.toLocaleString()} will be marked as paid.</span>
            </div>
          )}

          {/* Allow Credit = Yes fields */}
          {allowCredit && (
            <div className="space-y-4 border rounded-2xl p-4 bg-slate-50 border-gray-100 animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-2 gap-4">
                {/* Initial Received */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wide">
                    Amount Received (₹)
                  </label>
                  <Input
                    type="number"
                    value={initialAmountReceived}
                    onChange={(e) => setInitialAmountReceived(Number(e.target.value))}
                    max={totalBillAmount}
                    className="h-8 text-xs bg-white"
                  />
                </div>

                {/* Remaining Balance */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wide">
                    Remaining Amount
                  </label>
                  <div className="h-8 px-3 border border-gray-200 bg-gray-100 rounded-lg flex items-center text-xs font-bold text-gray-800">
                    ₹{remainingAmount.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Due Date */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1">
                    <CalendarRange size={12} className="text-gray-500" />
                    Credit Due Date
                  </label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="h-8 text-xs bg-white"
                    required
                  />
                </div>
              </div>

              {/* Remarks */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wide">
                  Remarks / Notes
                </label>
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Terms discussed with customer."
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
                    {remainingAmount.toLocaleString()} exceeds customer's max credit limit of ₹
                    {Number(customer?.maxCreditAmount).toLocaleString()}!
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
              onClick={() => onOpenChange(false)}
              className="h-9 text-xs"
              disabled={linkBillMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={linkBillMutation.isPending || exceedsLimit}
              className="h-9 text-xs bg-black text-white hover:bg-zinc-800"
            >
              {linkBillMutation.isPending ? "Linking..." : "Link Bill"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
