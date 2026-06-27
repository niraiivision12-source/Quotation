import { Plus } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import type { QuotationItemForm } from "../quotation.types";
import QuotationRow from "./QuotationRow";

interface Props {
  items: QuotationItemForm[];

  onUpdate: (id: string, updates: Partial<QuotationItemForm>) => void;

  onRemove: (id: string) => void;

  onAddRow: () => void;
}

export default function QuotationItemsTable({
  items,
  onUpdate,
  onRemove,
  onAddRow,
}: Props) {
  useEffect(() => {
    function handleShortcut(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();

        onAddRow();
      }
    }

    window.addEventListener("keydown", handleShortcut);

    return () => {
      window.removeEventListener("keydown", handleShortcut);
    };
  }, [onAddRow]);

  return (
    <div className="max-w-full overflow-hidden rounded-xl border bg-white">
      {/* Header */}
      <div className="border-b bg-slate-50 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Quotation Items</h2>
            <p className="text-sm text-muted-foreground">Add products and set margins</p>
          </div>
          <Button type="button" size="sm" onClick={onAddRow}>
            <Plus size={14} className="mr-1" /> Add Item
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="relative">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full min-w-245">
            <thead className="bg-slate-100 text-sm">
              <tr>
                <th className="p-4 text-left">Product</th>

                <th className="p-4 text-left">Cost Price</th>

                <th className="p-4 text-left">Margin %</th>

                <th className="p-4 text-left">Selling Price</th>

                <th className="p-4 text-left">Qty</th>

                <th className="p-4 text-left">Total</th>

                <th className="p-4 text-left">Action</th>
              </tr>
            </thead>

            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-10 text-center text-muted-foreground"
                  >
                    No items added
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <QuotationRow
                    key={item.id}
                    item={item}
                    onUpdate={onUpdate}
                    onRemove={onRemove}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t bg-slate-50/60 px-5 py-3">
        <button
          type="button"
          onClick={onAddRow}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700"
        >
          <Plus size={16} />
          Add Another Item
          <span className="ml-2 rounded border bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-400">
            Ctrl / ⌘ + Enter
          </span>
        </button>
      </div>
    </div>
  );
}
