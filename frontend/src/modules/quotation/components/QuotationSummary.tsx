interface Props {
  subtotal: number;

  discountAmount: number;

  totalGst: number;

  onDiscountChange: (value: number) => void;
}

export default function QuotationSummary({
  subtotal,
  discountAmount,
  totalGst,
  onDiscountChange,
}: Props) {
  const totalAmount = Math.max(subtotal - discountAmount + totalGst, 0);

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Quotation Summary</h2>
      </div>

      <div className="space-y-4">
        {/* Subtotal */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>

          <span className="font-medium">₹ {subtotal.toFixed(2)}</span>
        </div>

        {/* Discount */}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Discount</label>

          <input
            type="number"
            min={0}
            value={discountAmount}
            className="w-full rounded-xl border p-3 outline-none focus:ring-2 focus:ring-black"
            onChange={(e) => onDiscountChange(Number(e.target.value))}
          />
        </div>

        {/* Total GST */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total GST</span>

          <span className="font-medium">₹ {totalGst.toFixed(2)}</span>
        </div>

        {/* Divider */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">Grand Total</span>

            <span className="text-2xl font-bold">
              ₹ {totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
