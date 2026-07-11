import { useState, useEffect, startTransition } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { useRecordTransaction } from "../payment.query";
import type { Payment } from "../payment.types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: Payment;
  onSuccess?: () => void;
}

export default function RecordPaymentDialog({ open, onOpenChange, payment, onSuccess }: Props) {
  const recordMutation = useRecordTransaction();

  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      startTransition(() => {
        setAmount(Number(payment.pendingAmount));
        setDate(new Date().toISOString().split("T")[0]);
        setPaymentMethod("BANK_TRANSFER");
        setReferenceNumber("");
        setNotes("");
      });
    }
  }, [open, payment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (amount <= 0) {
      toast.error("Payment amount must be greater than 0");
      return;
    }

    if (amount > Number(payment.pendingAmount)) {
      toast.error(`Payment amount cannot exceed outstanding balance of ₹${Number(payment.pendingAmount).toLocaleString()}`);
      return;
    }

    try {
      await recordMutation.mutateAsync({
        paymentId: payment.id,
        data: {
          amount,
          date,
          paymentMethod,
          referenceNumber: referenceNumber || null,
          notes: notes || null,
        },
      });

      toast.success("Payment transaction recorded successfully!");
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to record payment transaction");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 bg-white border rounded-2xl shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <DialogHeader className="border-b pb-3 mb-4">
          <DialogTitle className="text-lg font-bold tracking-tight text-gray-900">
            Record Payment Received
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Bill Reference: <strong className="text-gray-900">#{payment.billNumber}</strong> · Outstanding:{" "}
            <strong className="text-rose-600">₹{Number(payment.pendingAmount).toLocaleString()}</strong>
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Amount */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-800 uppercase tracking-wider">
                Amount Received (₹)
              </label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                max={Number(payment.pendingAmount)}
                className="h-9 text-sm font-semibold"
                required
              />
            </div>

            {/* Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-800 uppercase tracking-wider">
                Payment Date
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 text-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Payment Method */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-800 uppercase tracking-wider">
                Payment Method
              </label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reference Number */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-800 uppercase tracking-wider">
                Reference Number / TxID
              </label>
              <Input
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. UTR / Chq Number"
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-800 uppercase tracking-wider">
              Notes
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Received via GPay / HDFC Bank."
              className="text-xs resize-none"
              rows={3}
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 border-t pt-3 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 text-xs"
              disabled={recordMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={recordMutation.isPending}
              className="h-9 text-xs bg-black text-white hover:bg-zinc-800"
            >
              {recordMutation.isPending ? "Recording..." : "Record Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
