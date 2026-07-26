import { Search, X, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Button } from "../../../components/ui/button";
import { useDealers } from "../../dealer/dealer.query";
import CreateDealerDialog from "../../dealer/CreateDealerDialog";
import type { Dealer } from "../../dealer/dealer.types";

interface Props {
  dealerId?: string;
  onDealerChange: (id: string) => void;
  expectedDeliveryDate?: string;
  onExpectedDeliveryDateChange: (value: string) => void;
  deliveryAddress?: string;
  onDeliveryAddressChange: (value: string) => void;
  notes?: string;
  onNotesChange: (value: string) => void;
  onPreviewDetailsChange?: (details: {
    targetName?: string;
  }) => void;
}

export default function PurchaseOrderInfoCard({
  dealerId,
  onDealerChange,
  expectedDeliveryDate = "",
  onExpectedDeliveryDateChange,
  deliveryAddress = "",
  onDeliveryAddressChange,
  notes = "",
  onNotesChange,
  onPreviewDetailsChange,
}: Props) {
  const searchWrapRef = useRef<HTMLDivElement | null>(null);

  const [search, setSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const { data } = useDealers();
  const dealers = data?.items || [];

  const selectedDealer = useMemo(() => {
    return dealers.find((d) => d.id === dealerId) || null;
  }, [dealerId, dealers]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchWrapRef.current && !searchWrapRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync selected contact details with search value and preview
  useEffect(() => {
    if (selectedDealer) {
      setSearch(selectedDealer.name);
      onPreviewDetailsChange?.({ targetName: selectedDealer.name });
    } else {
      setSearch("");
      onPreviewDetailsChange?.({});
    }
  }, [selectedDealer, onPreviewDetailsChange]);

  const activeOptions = useMemo(() => {
    const s = search.toLowerCase().trim();
    if (!s) return dealers;
    return dealers.filter((d) => d.name.toLowerCase().includes(s) || d.mobile.includes(s));
  }, [search, dealers]);

  function handleSelectOption(dealer: Dealer) {
    setIsDropdownOpen(false);
    setSearch(dealer.name);
    onDealerChange(dealer.id);
    onPreviewDetailsChange?.({
      targetName: dealer.name,
    });
  }

  function handleClearSelection() {
    setSearch("");
    onDealerChange("");
    onPreviewDetailsChange?.({});
  }

  return (
    <div className="rounded-xl border bg-white p-5 space-y-4">
      <div>
        <h2 className="text-base font-semibold">Supplier / Dealer Information</h2>
        <p className="text-sm text-muted-foreground">Select a supplier/dealer from the database for this order</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Search autocomplete */}
        <div ref={searchWrapRef} className="relative">
          <label className="text-sm font-medium text-slate-700">Search Dealer / Supplier *</label>
          <div className="flex gap-2 mt-1">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                className="pl-9 pr-8"
                placeholder="Type to search dealers by name or phone..."
                onClick={() => setIsDropdownOpen(true)}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setIsDropdownOpen(true);
                }}
              />
              {dealerId && (
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <CreateDealerDialog
              onDealerCreated={(newDealer) => {
                onDealerChange(newDealer.id);
              }}
              trigger={
                <Button type="button" variant="outline" className="shrink-0 flex items-center gap-1 h-10 px-3 text-xs">
                  <Plus size={14} /> Add Dealer
                </Button>
              }
            />
          </div>

          {isDropdownOpen && (
            <div className="absolute z-30 mt-2 max-h-60 w-full overflow-y-auto rounded-lg border bg-white shadow-lg divide-y divide-slate-100">
              {activeOptions.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">No dealers found</div>
              ) : (
                activeOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(opt)}
                    className="flex w-full flex-col p-3 text-left transition-colors hover:bg-slate-50"
                  >
                    <span className="font-semibold text-slate-800 text-sm">{opt.name}</span>
                    <span className="text-xs text-slate-500">Mobile: {opt.mobile} {opt.gst && `| GSTIN: ${opt.gst}`}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Selected card details card */}
        {selectedDealer ? (
          <div className="rounded-lg border bg-slate-50/50 p-3.5 text-xs space-y-1">
            <div className="font-semibold text-slate-700 text-sm">Selected Dealer Profile</div>
            <div className="text-slate-600 space-y-0.5 mt-1">
              <div><span className="font-medium text-slate-800">Name:</span> {selectedDealer.name}</div>
              {selectedDealer.contactPerson && <div><span className="font-medium text-slate-800">Contact Person:</span> {selectedDealer.contactPerson}</div>}
              <div><span className="font-medium text-slate-800">Phone:</span> {selectedDealer.mobile}</div>
              {selectedDealer.email && <div><span className="font-medium text-slate-800">Email:</span> {selectedDealer.email}</div>}
              {selectedDealer.gst && <div><span className="font-medium text-slate-800">GSTIN:</span> {selectedDealer.gst}</div>}
              {selectedDealer.address && <div><span className="font-medium text-slate-800">Address:</span> {selectedDealer.address}</div>}
              {(selectedDealer.city || selectedDealer.state) && (
                <div>
                  <span className="font-medium text-slate-800">Location:</span> {[selectedDealer.city, selectedDealer.state].filter(Boolean).join(", ")}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed flex items-center justify-center p-6 text-center text-xs text-muted-foreground bg-slate-50/20">
            Please search and select a dealer to proceed
          </div>
        )}
      </div>

      {/* Expected Date, Delivery Address and Remarks */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 pt-2 border-t border-slate-100">
        <div>
          <label className="text-sm font-medium text-slate-700">Expected Delivery Date</label>
          <Input
            type="date"
            value={expectedDeliveryDate}
            className="mt-1"
            onChange={(e) => onExpectedDeliveryDateChange(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Delivery Address / Destination</label>
          <Input
            value={deliveryAddress}
            className="mt-1"
            placeholder="E.g., Main Shop Warehouse, Kottayam"
            onChange={(e) => onDeliveryAddressChange(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Delivery Instructions / Remarks</label>
          <Textarea
            value={notes}
            rows={1}
            className="mt-1 min-h-[40px] resize-y py-2"
            placeholder="Special loading instructions, notes, etc."
            onChange={(e) => onNotesChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
