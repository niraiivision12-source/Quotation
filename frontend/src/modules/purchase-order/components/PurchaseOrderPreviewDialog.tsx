import { Check } from "lucide-react";

import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import type { CreatePurchaseOrderDTO } from "../purchase-order.types";
import type { QuotationItemForm } from "../../quotation/quotation.types";

interface User {
  id: string;
  name: string;
  role: string;
}

interface Props {
  open: boolean;
  payload: CreatePurchaseOrderDTO | null;
  dealerName?: string;
  items: QuotationItemForm[];
  users: User[];
  isCreating: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: () => void;
  onEdit?: () => void;
  readOnly?: boolean;
}

export default function PurchaseOrderPreviewDialog({
  open,
  payload,
  dealerName,
  items,
  users,
  isCreating,
  onOpenChange,
  onConfirm,
  onEdit,
  readOnly = false,
}: Props) {
  const owner = users.find((user) => user.id === payload?.createdById);
  const validItems = items.filter((item) => item.productId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Purchase Order Preview</DialogTitle>
        </DialogHeader>

        {payload && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-slate-50 p-3 text-sm md:grid-cols-3">
              <PreviewStat
                label="Supplier / Dealer"
                value={dealerName || "—"}
              />
              <PreviewStat label="Document Type" value="Purchase Order" />
              <PreviewStat label="Prepared By" value={owner?.name ?? "—"} />
              <PreviewStat
                label="Expected Delivery"
                value={payload.expectedDeliveryDate ? new Date(payload.expectedDeliveryDate).toLocaleDateString() : "—"}
              />
              <PreviewStat
                label="Destination"
                value={payload.deliveryAddress || "Warehouse"}
              />
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-3 text-left">Product</th>
                    <th className="p-3 text-left">SKU</th>
                    <th className="p-3 text-right">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {validItems.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-3">
                        <div className="font-medium">
                          {item.productName ?? item.search}
                        </div>
                      </td>
                      <td className="p-3 font-mono text-xs">{item.sku ?? "—"}</td>
                      <td className="p-3 text-right font-medium">
                        {item.quantity} {item.unit && `(${item.unit})`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {payload.notes && (
              <div className="rounded-lg border p-3 text-sm">
                <div className="mb-1 font-medium text-slate-700">Remarks & Special Instructions</div>
                <p className="text-muted-foreground">{payload.notes}</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex flex-row justify-between items-center w-full gap-2 sm:gap-0">
          <div>
            {!readOnly && onEdit && (
              <Button
                type="button"
                onClick={onEdit}
                className="bg-indigo-600 hover:bg-indigo-750 text-white font-medium text-xs h-9"
              >
                Edit Details
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
              className="text-xs h-9"
            >
              {readOnly ? "Close" : onEdit ? "Close" : "Back"}
            </Button>
            {!readOnly && !onEdit && onConfirm && (
              <Button type="button" onClick={onConfirm} disabled={isCreating} className="text-xs h-9">
                <Check className="mr-1" size={13} />
                {isCreating ? "Creating..." : "Confirm & Export PO"}
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
      <div className="mt-0.5 font-medium text-slate-900">{value}</div>
    </div>
  );
}
