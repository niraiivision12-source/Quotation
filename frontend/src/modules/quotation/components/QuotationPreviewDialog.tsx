import { Check } from "lucide-react";

import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";

import type { CreateQuotationDTO, QuotationItemForm } from "../quotation.types";

interface User {
  id: string;
  name: string;
  role: string;
}

interface Props {
  open: boolean;
  payload: CreateQuotationDTO | null;
  quotationType: "LEAD" | "CUSTOMER" | "WALK_IN_CUSTOMER";
  targetName?: string;
  projectName?: string;
  items: QuotationItemForm[];
  users: User[];
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  isCreating: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onEdit?: () => void;
}

export default function QuotationPreviewDialog({
  open,
  payload,
  quotationType,
  targetName,
  projectName,
  items,
  users,
  subtotal,
  discountAmount,
  totalAmount,
  isCreating,
  onOpenChange,
  onConfirm,
  onEdit,
}: Props) {
  const owner = users.find((user) => user.id === payload?.createdById);
  const validItems = items.filter((item) => item.productId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Quotation Preview</DialogTitle>
        </DialogHeader>

        {payload && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-slate-50 p-3 text-sm md:grid-cols-3">
              <PreviewStat
                label={
                  quotationType === "LEAD"
                    ? "Lead"
                    : quotationType === "CUSTOMER"
                    ? "Customer"
                    : "Walk-In Customer"
                }
                value={
                  quotationType === "WALK_IN_CUSTOMER"
                    ? payload.walkInName ?? "-"
                    : targetName ?? "-"
                }
              />
              {quotationType !== "WALK_IN_CUSTOMER" && (
                <PreviewStat label="Project" value={projectName ?? "-"} />
              )}
              <PreviewStat label="Type" value={quotationType} />
              {quotationType === "CUSTOMER" && (
                <PreviewStat label="Phase" value={payload.phase ?? "-"} />
              )}
              <PreviewStat label="Owner" value={owner?.name ?? "-"} />
              <PreviewStat
                label="Valid Until"
                value={payload.validUntil || "-"}
              />
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-155 text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-3 text-left">Product</th>
                    <th className="p-3 text-right">Qty</th>
                    <th className="p-3 text-right">Margin</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {validItems.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-3">
                        <div className="font-medium">
                          {item.productName ?? item.search}
                        </div>
                        {item.sku && (
                          <div className="text-xs text-muted-foreground">
                            {item.sku}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-right">{item.quantity}</td>
                      <td className="p-3 text-right">{item.marginPercent}%</td>
                      <td className="p-3 text-right font-medium">
                        ₹ {item.totalPrice.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {payload.notes && (
              <div className="rounded-lg border p-3 text-sm">
                <div className="mb-1 font-medium">Notes</div>
                <p className="text-muted-foreground">{payload.notes}</p>
              </div>
            )}

            <div className="ml-auto w-full max-w-sm space-y-2 rounded-lg border bg-white p-3 text-sm">
              <PreviewAmount label="Subtotal" value={subtotal} />
              <PreviewAmount label="Discount" value={discountAmount} />
              <div className="border-t pt-2">
                <PreviewAmount label="Total" value={totalAmount} strong />
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex flex-row justify-between items-center w-full gap-2 sm:gap-0">
          <div>
            {onEdit && (
              <Button
                type="button"
                onClick={onEdit}
                className="bg-violet-600 hover:bg-violet-750 text-white font-medium"
              >
                Edit Quotation
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              {onEdit ? "Close" : "Back"}
            </Button>
            {!onEdit && (
              <Button type="button" onClick={onConfirm} disabled={isCreating}>
                <Check />
                {isCreating ? "Creating..." : "OK, Create"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-medium">{value}</div>
    </div>
  );
}

function PreviewAmount({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between ${
        strong ? "text-base font-semibold" : ""
      }`}
    >
      <span className="text-muted-foreground">{label}</span>
      <span>₹ {value.toFixed(2)}</span>
    </div>
  );
}
