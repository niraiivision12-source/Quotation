import { Trash2, History, X } from "lucide-react";

import { useEffect, useRef, useState } from "react";

import { createPortal } from "react-dom";

import type { Product } from "../../product/product.types";

import { useProductDropdownSearch } from "../../../hooks/useProductDropdownSearch";

import { highlightText } from "../../../utils/highlight.utils";

import type { QuotationItemForm } from "../quotation.types";

import { calculateSellingPrice, calculateSellingPriceFromMRP, calculateTotal } from "../quotation.utils";

interface Props {
  item: QuotationItemForm;

  onUpdate: (id: string, updates: Partial<QuotationItemForm>) => void;

  onRemove: (id: string) => void;

  /** Adding from the last row starts the next one — keyboard-only entry. */
  onAddRow: () => void;

  /** This row was just created; put the cursor in its product search. */
  shouldFocus?: boolean;

  /** The same product is already on another line. */
  isDuplicate?: boolean;
}

export default function QuotationRow({
  item,
  onUpdate,
  onRemove,
  onAddRow,
  shouldFocus,
  isDuplicate,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const quantityRef = useRef<HTMLInputElement | null>(null);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const dropdownListRef = useRef<HTMLDivElement | null>(null);

  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const [costPriceInput, setCostPriceInput] = useState(String(item.costPrice ?? 0));

  const [marginInput, setMarginInput] = useState(String(item.marginPercent ?? 0));

  const [mrpInput, setMRPInput] = useState(String(item.mrp ?? 0));

  const [discountInput, setDiscountInput] = useState(String(item.discountPercent ?? 0));

  const [sellingPriceInput, setSellingPriceInput] = useState(String(item.sellingPrice ?? 0));

  const [gstInput, setGstInput] = useState(String(item.gstPercent ?? 18));

  const [quantityInput, setQuantityInput] = useState(String(item.quantity));

  const activeNumberFieldRef = useRef<"cost" | "margin" | "mrp" | "discount" | "sellingPrice" | "gst" | "quantity" | null>(
    null,
  );

  // A freshly added row lands with the cursor already in its search box, so
  // you can add several items without reaching for the mouse.
  useEffect(() => {
    if (shouldFocus) {
      inputRef.current?.focus();
    }
  }, [shouldFocus]);

  const {
    query,
    dropdownItems,
    selectedIndex,
    setSelectedIndex,
    recentSearches,
    clearRecentSearches,
    removeRecentSearch,
    handleInputChange,
    handleKeyDown,
    selectProduct,
    handleRecentSearchSelect,
    isLoading: isLoadingProducts,
  } = useProductDropdownSearch({
    searchVal: item.search || "",
    setSearchVal: (val) => onUpdate(item.id, { search: val }),
    onSelectProduct: (product) => handleProductSelect(product),
    onCloseDropdown: () => onUpdate(item.id, { showDropdown: false }),
  });

  useEffect(() => {
    if (item.showDropdown && selectedIndex >= 0 && dropdownListRef.current) {
      const activeEl = dropdownListRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({
          block: "nearest",
        });
      }
    }
  }, [selectedIndex, item.showDropdown]);

  // Position the portalled dropdown under its input.
  useEffect(() => {
    if (!item.showDropdown) {
      setDropdownPosition(null);
      return;
    }

    function updatePosition() {
      if (!inputRef.current) return;

      const rect = inputRef.current.getBoundingClientRect();

      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }

    updatePosition();

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [item.showDropdown]);

  // click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        onUpdate(item.id, {
          showDropdown: false,
        });
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [item.id, onUpdate]);



  useEffect(() => {
    if (activeNumberFieldRef.current === "cost") return;

    setCostPriceInput(String(item.costPrice ?? 0));
  }, [item.costPrice]);

  useEffect(() => {
    if (activeNumberFieldRef.current === "margin") return;

    setMarginInput(String(item.marginPercent ?? 0));
  }, [item.marginPercent]);

  useEffect(() => {
    if (activeNumberFieldRef.current === "mrp") return;

    setMRPInput(String(item.mrp ?? 0));
  }, [item.mrp]);

  useEffect(() => {
    if (activeNumberFieldRef.current === "discount") return;

    setDiscountInput(String(item.discountPercent ?? 0));
  }, [item.discountPercent]);

  useEffect(() => {
    if (activeNumberFieldRef.current === "sellingPrice") return;

    setSellingPriceInput(String(item.sellingPrice ?? 0));
  }, [item.sellingPrice]);

  useEffect(() => {
    if (activeNumberFieldRef.current === "gst") return;

    setGstInput(String(item.gstPercent ?? 18));
  }, [item.gstPercent]);

  useEffect(() => {
    if (activeNumberFieldRef.current === "quantity") return;

    setQuantityInput(String(item.quantity));
  }, [item.quantity]);

  function handleNumberFocus(field: "cost" | "margin" | "mrp" | "discount" | "sellingPrice" | "gst" | "quantity") {
    activeNumberFieldRef.current = field;
  }

  function handleNumberBlur(field: "cost" | "margin" | "mrp" | "discount" | "sellingPrice" | "gst" | "quantity") {
    activeNumberFieldRef.current = null;

    if (field === "cost" && costPriceInput === "") {
      setCostPriceInput("0");
    }

    if (field === "margin" && marginInput === "") {
      setMarginInput("0");
    }

    if (field === "mrp" && mrpInput === "") {
      setMRPInput("0");
    }

    if (field === "discount" && discountInput === "") {
      setDiscountInput("0");
    }

    if (field === "sellingPrice" && sellingPriceInput === "") {
      setSellingPriceInput("0");
    }

    if (field === "gst" && gstInput === "") {
      setGstInput("18");
    }

    if (field === "quantity" && quantityInput === "") {
      setQuantityInput("0");
    }
  }

  // PRODUCT SELECT
  function handleProductSelect(product: Product) {
    const hasMrp = product.mrp !== undefined && product.mrp !== null && Number(product.mrp) > 0;
    
    let costPrice = 0;
    let marginPercent = 0;
    let mrp = 0;
    let discountPercent = 0;
    let sellingPrice = 0;

    if (hasMrp) {
      mrp = Number(product.mrp);
      discountPercent = 0;
      sellingPrice = mrp;
    } else {
      costPrice = Number(product.costPrice || 0);
      marginPercent = item.marginPercent ?? 0;
      sellingPrice = calculateSellingPrice(costPrice, marginPercent);
    }

    const totalPrice = calculateTotal(sellingPrice, item.quantity);

    onUpdate(item.id, {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      unit: product.unit,
      stockQty: product.stockQty,

      search: product.name,
      showDropdown: false,

      costPrice,
      marginPercent,
      mrp,
      discountPercent,
      gstPercent: 18,
      isManualPrice: false,
      sellingPrice,
      totalPrice,
    });

    requestAnimationFrame(() => {
      quantityRef.current?.focus();
      quantityRef.current?.select();
    });
  }

  // COST PRICE
  function handleCostPriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const rawValue = e.target.value;
    setCostPriceInput(rawValue);
    const costPrice = rawValue === "" ? 0 : Number(rawValue);

    if (item.isManualPrice) {
      const sellingPrice = item.sellingPrice || 0;
      const marginPercent = sellingPrice === 0 ? 0 : ((sellingPrice - costPrice) / sellingPrice) * 100;
      onUpdate(item.id, {
        costPrice,
        marginPercent,
        mrp: 0,
        discountPercent: 0,
      });
    } else {
      const sellingPrice = calculateSellingPrice(costPrice, item.marginPercent || 0);
      const totalPrice = calculateTotal(sellingPrice, item.quantity);
      onUpdate(item.id, {
        costPrice,
        sellingPrice,
        totalPrice,
        mrp: 0,
        discountPercent: 0,
      });
    }
  }

  // MARGIN
  function handleMarginChange(e: React.ChangeEvent<HTMLInputElement>) {
    const rawValue = e.target.value;
    setMarginInput(rawValue);
    const marginPercent = rawValue === "" ? 0 : Number(rawValue);
    const sellingPrice = calculateSellingPrice(item.costPrice || 0, marginPercent);
    const totalPrice = calculateTotal(sellingPrice, item.quantity);

    onUpdate(item.id, {
      marginPercent,
      sellingPrice,
      totalPrice,
      isManualPrice: false,
      mrp: 0,
      discountPercent: 0,
    });
  }

  // MRP
  function handleMRPChange(e: React.ChangeEvent<HTMLInputElement>) {
    const rawValue = e.target.value;
    setMRPInput(rawValue);
    const mrp = rawValue === "" ? 0 : Number(rawValue);

    if (item.isManualPrice) {
      const sellingPrice = item.sellingPrice || 0;
      const discountPercent = mrp === 0 ? 0 : ((mrp - sellingPrice) / mrp) * 100;
      onUpdate(item.id, {
        mrp,
        discountPercent,
        costPrice: 0,
        marginPercent: 0,
      });
    } else {
      const sellingPrice = calculateSellingPriceFromMRP(mrp, item.discountPercent || 0);
      const totalPrice = calculateTotal(sellingPrice, item.quantity);
      onUpdate(item.id, {
        mrp,
        sellingPrice,
        totalPrice,
        costPrice: 0,
        marginPercent: 0,
      });
    }
  }

  // DISCOUNT
  function handleDiscountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const rawValue = e.target.value;
    setDiscountInput(rawValue);
    const discountPercent = rawValue === "" ? 0 : Number(rawValue);
    const sellingPrice = calculateSellingPriceFromMRP(item.mrp || 0, discountPercent);
    const totalPrice = calculateTotal(sellingPrice, item.quantity);

    onUpdate(item.id, {
      discountPercent,
      sellingPrice,
      totalPrice,
      isManualPrice: false,
      costPrice: 0,
      marginPercent: 0,
    });
  }

  // SELLING PRICE (Manual Entry)
  function handleSellingPriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const rawValue = e.target.value;
    setSellingPriceInput(rawValue);
    const sellingPrice = rawValue === "" ? 0 : Number(rawValue);
    const totalPrice = calculateTotal(sellingPrice, item.quantity);

    if (isMrpActive) {
      const mrp = item.mrp || 0;
      const discountPercent = mrp === 0 ? 0 : ((mrp - sellingPrice) / mrp) * 100;
      onUpdate(item.id, {
        sellingPrice,
        totalPrice,
        discountPercent,
        isManualPrice: true,
      });
    } else {
      const costPrice = item.costPrice || 0;
      const marginPercent = sellingPrice === 0 ? 0 : ((sellingPrice - costPrice) / sellingPrice) * 100;
      onUpdate(item.id, {
        sellingPrice,
        totalPrice,
        marginPercent,
        isManualPrice: true,
      });
    }
  }

  // GST
  function handleGSTChange(e: React.ChangeEvent<HTMLInputElement>) {
    const rawValue = e.target.value;
    setGstInput(rawValue);
    const gstPercent = rawValue === "" ? 0 : Number(rawValue);
    onUpdate(item.id, {
      gstPercent,
    });
  }

  // QUANTITY
  function handleQuantityChange(e: React.ChangeEvent<HTMLInputElement>) {
    const rawValue = e.target.value;
    setQuantityInput(rawValue);
    const quantity = rawValue === "" ? 0 : Number(rawValue);
    const totalPrice = calculateTotal(item.sellingPrice, quantity);
    onUpdate(item.id, {
      quantity,
      totalPrice,
    });
  }



  const overStock =
    item.stockQty !== undefined && item.quantity > item.stockQty;

  const isMrpActive = (item.mrp ?? 0) > 0 || (item.discountPercent ?? 0) > 0;

  return (
    <tr className="border-b">
      {/* PRODUCT */}
      <td className="w-[280px] p-3 align-top">
        <div ref={wrapperRef} className="relative">
          <input
            ref={inputRef}
            value={item.search || ""}
            placeholder="Search product..."
            className={`w-full rounded-xl border px-3 py-2 text-sm transition-shadow focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 ${
              isDuplicate ? "border-amber-400 bg-amber-50/50" : ""
            }`}
            onFocus={() =>
              onUpdate(item.id, {
                showDropdown: true,
              })
            }
            onKeyDown={handleKeyDown}
            onChange={(e) => handleInputChange(e.target.value)}
          />
        </div>

        {item.productId && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {item.unit && (
              <span className="text-[10px] text-muted-foreground">
                per {item.unit}
              </span>
            )}

            {item.stockQty !== undefined && (
              <span
                className={`text-[10px] font-medium ${
                  item.stockQty <= 0
                    ? "text-rose-600"
                    : item.stockQty < 20
                      ? "text-amber-600"
                      : "text-emerald-600"
                }`}
              >
                {item.stockQty} in stock
              </span>
            )}

            {isDuplicate && (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                already on another line
              </span>
            )}
          </div>
        )}

        {item.showDropdown && dropdownPosition &&
          createPortal(
            <div
              ref={dropdownRef}
              className="absolute z-50 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
              style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: Math.max(dropdownPosition.width, 420),
              }}
            >
              <div className="border-b bg-slate-50 px-4 py-2 text-xs flex justify-between items-center font-medium text-slate-500">
                <span>{query.trim() ? "Search Results" : "Recent Searches"}</span>
                {isLoadingProducts && (
                  <span className="text-[10px] text-slate-400 animate-pulse">Loading index...</span>
                )}
                {!query.trim() && recentSearches.length > 0 && (
                  <button
                    type="button"
                    onClick={clearRecentSearches}
                    className="text-[10px] text-rose-600 hover:text-rose-800 font-semibold hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div ref={dropdownListRef} className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {dropdownItems.length === 0 ? (
                  <div className="p-4 text-sm text-slate-500 text-center">
                    No products found
                  </div>
                ) : (
                  dropdownItems.map((dropdownItem, index) => {
                    const isActive = index === selectedIndex;

                    if (dropdownItem.type === "recent") {
                      return (
                        <div
                          key={`recent-${dropdownItem.query}`}
                          className={`flex w-full items-center justify-between gap-2 p-2 px-3 text-left transition-colors ${
                            isActive ? "bg-slate-100 text-slate-900" : "hover:bg-slate-50"
                          }`}
                          onMouseEnter={() => setSelectedIndex(index)}
                        >
                          <button
                            type="button"
                            className="flex items-center gap-2 flex-1 text-left text-sm font-medium text-slate-700"
                            onClick={() => handleRecentSearchSelect(dropdownItem.query)}
                          >
                            <History size={13} className="text-slate-400" />
                            <span>{dropdownItem.query}</span>
                          </button>
                          <button
                            type="button"
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-sm transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeRecentSearch(dropdownItem.query);
                            }}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      );
                    }

                    const product = dropdownItem.product;
                    return (
                      <button
                        key={`prod-${product.id}`}
                        type="button"
                        className={`flex w-full items-center justify-between gap-3 p-3 text-left transition-colors ${
                          isActive ? "bg-slate-900 text-white" : "hover:bg-slate-50 text-slate-800"
                        }`}
                        onMouseEnter={() => setSelectedIndex(index)}
                        onClick={() => selectProduct(product)}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold">
                            {highlightText(product.name, query)}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] opacity-80">
                            {product.sku && (
                              <span className={`font-mono px-1 rounded-sm text-[10px] font-bold ${
                                isActive ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-700"
                              }`}>
                                {highlightText(product.sku, query)}
                              </span>
                            )}
                            {product.brand && (
                              <span>{highlightText(product.brand, query)}</span>
                            )}
                            {product.brand && product.category && <span>·</span>}
                            {product.category && (
                              <span>{highlightText(product.category, query)}</span>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <div className="text-sm font-bold">
                            ₹{Number(product.mrp || product.costPrice || 0).toLocaleString("en-IN")}
                            <span className="text-[10px] ml-1 font-normal opacity-70">
                              {product.mrp ? "(MRP)" : "(Cost)"}
                            </span>
                          </div>
                          <div
                            className={`text-[11px] mt-0.5 ${
                              isActive
                                ? "text-slate-300"
                                : product.stockQty <= 0
                                  ? "text-rose-600 font-semibold"
                                  : product.stockQty < 20
                                    ? "text-amber-600 font-semibold"
                                    : "text-emerald-600 font-semibold"
                            }`}
                          >
                            {product.stockQty} in stock
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>,
            document.body,
          )}
      </td>

      {/* QUANTITY */}
      <td className="w-24 p-3 align-top">
        <input
          ref={quantityRef}
          type="number"
          min={1}
          value={quantityInput}
          className="w-full rounded border p-2 text-sm"
          onFocus={() => handleNumberFocus("quantity")}
          onBlur={() => handleNumberBlur("quantity")}
          onChange={handleQuantityChange}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAddRow();
            }
          }}
        />

        {overStock && (
          <p className="mt-1 text-[10px] font-medium text-amber-600">
            Only {item.stockQty} in stock
          </p>
        )}
      </td>

      {/* COST PRICE */}
      <td className="w-28 p-3 align-top">
        <input
          type="number"
          value={costPriceInput}
          className={`w-full rounded border p-2 text-sm transition-colors ${
            isMrpActive ? "bg-slate-50 text-slate-400 opacity-60" : "bg-white text-slate-900"
          }`}
          onFocus={() => handleNumberFocus("cost")}
          onBlur={() => handleNumberBlur("cost")}
          onChange={handleCostPriceChange}
        />
      </td>

      {/* MRP */}
      <td className="w-28 p-3 align-top">
        <input
          type="number"
          value={mrpInput}
          className={`w-full rounded border p-2 text-sm transition-colors ${
            !isMrpActive ? "bg-slate-50 text-slate-400 opacity-60" : "bg-white text-slate-900"
          }`}
          onFocus={() => handleNumberFocus("mrp")}
          onBlur={() => handleNumberBlur("mrp")}
          onChange={handleMRPChange}
        />
      </td>

      {/* MARGIN % */}
      <td className="w-24 p-3 align-top">
        <input
          type="number"
          value={marginInput}
          className={`w-full rounded border p-2 text-sm transition-colors ${
            isMrpActive ? "bg-slate-50 text-slate-400 opacity-60" : "bg-white text-slate-900"
          }`}
          onFocus={() => handleNumberFocus("margin")}
          onBlur={() => handleNumberBlur("margin")}
          onChange={handleMarginChange}
        />
      </td>

      {/* DISCOUNT % */}
      <td className="w-24 p-3 align-top">
        <input
          type="number"
          value={discountInput}
          className={`w-full rounded border p-2 text-sm transition-colors ${
            !isMrpActive ? "bg-slate-50 text-slate-400 opacity-60" : "bg-white text-slate-900"
          }`}
          onFocus={() => handleNumberFocus("discount")}
          onBlur={() => handleNumberBlur("discount")}
          onChange={handleDiscountChange}
        />
      </td>

      {/* SELLING PRICE */}
      <td className="w-28 p-3 align-top">
        <input
          type="number"
          value={sellingPriceInput}
          className="w-full rounded border p-2 text-sm bg-white text-slate-900"
          onFocus={() => handleNumberFocus("sellingPrice")}
          onBlur={() => handleNumberBlur("sellingPrice")}
          onChange={handleSellingPriceChange}
        />
      </td>

      {/* GST % */}
      <td className="w-24 p-3 align-top">
        <input
          type="number"
          value={gstInput}
          className="w-full rounded border p-2 text-sm bg-white text-slate-900"
          onFocus={() => handleNumberFocus("gst")}
          onBlur={() => handleNumberBlur("gst")}
          onChange={handleGSTChange}
        />
      </td>

      {/* TOTAL */}
      <td className="w-32 p-3 align-top font-semibold">
        ₹{item.totalPrice.toFixed(2)}
      </td>

      {/* DELETE */}
      <td className="w-16 p-3 align-top">
        <button
          type="button"
          className="text-red-500 hover:bg-red-50 p-2 rounded"
          onClick={() => onRemove(item.id)}
        >
          <Trash2 size={18} />
        </button>
      </td>
    </tr>
  );
}
