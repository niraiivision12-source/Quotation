import { Plus } from "lucide-react";
import { useEffect } from "react";

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
    <div className="overflow-visible rounded-2xl border bg-white shadow-sm">
      {/* Header */}
      <div className="border-b bg-slate-50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Quotation Items</h2>

            <p className="text-sm text-muted-foreground">
              Add products and margins
            </p>
          </div>

          <button
            type="button"
            onClick={onAddRow}
            className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Add Item
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="relative overflow-visible">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="min-w-275 w-full overflow-visible">
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
      <div className="border-t bg-slate-50/80 px-6 py-4">
        <button
          type="button"
          onClick={onAddRow}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-black hover:bg-slate-50 hover:text-black"
        >
          <Plus size={18} />
          Add Another Item
          <span className="ml-2 rounded-md border bg-slate-100 px-2 py-1 text-[10px] text-slate-500">
            Ctrl / ⌘ + Enter
          </span>
        </button>
      </div>
    </div>
  );
}
