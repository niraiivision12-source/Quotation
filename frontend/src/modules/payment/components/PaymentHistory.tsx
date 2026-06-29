import { Calendar, User } from "lucide-react";
import type { PaymentTransaction } from "../payment.types";

interface Props {
  transactions: PaymentTransaction[];
}

export default function PaymentHistory({ transactions }: Props) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-8 border border-dashed rounded-2xl bg-slate-50/50">
        <p className="text-xs text-muted-foreground italic">No payment transactions recorded yet.</p>
      </div>
    );
  }

  // Sort transactions chronologically desc (newest first)
  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="relative border-l border-zinc-200 ml-3 pl-6 space-y-6">
      {sorted.map((tx) => {
        const dateStr = new Date(tx.date).toLocaleDateString([], {
          day: "numeric",
          month: "short",
          year: "numeric",
        });

        return (
          <div key={tx.id} className="relative group">
            {/* Dot marker */}
            <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 border border-white ring-4 ring-blue-50 shrink-0" />

            <div className="bg-white border rounded-xl p-4 shadow-2xs hover:border-blue-300 transition-colors space-y-2">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <span className="text-sm font-bold text-gray-900">
                    ₹{Number(tx.amount).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-2 bg-slate-100 border px-1.5 py-0.5 rounded font-medium uppercase tracking-wide">
                    {tx.paymentMethod.replace(/_/g, " ")}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Calendar size={11} />
                  {dateStr}
                </span>
              </div>

              {tx.referenceNumber && (
                <p className="text-xs font-semibold text-gray-700">
                  Ref / TxID: <span className="font-mono text-zinc-900">{tx.referenceNumber}</span>
                </p>
              )}

              {tx.notes && (
                <p className="text-xs text-gray-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  {tx.notes}
                </p>
              )}

              <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 border-t pt-2 mt-1">
                <User size={10} />
                <span>Recorded by {tx.updatedBy?.name || "System"}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
