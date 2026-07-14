import { Trash2 } from "lucide-react";

import { useEffect, useMemo, useRef, useState } from "react";

import { createPortal } from "react-dom";

import { useProducts } from "../../product/product.query";

import type { Product } from "../../product/product.types";

import type { QuotationItemForm } from "../quotation.types";

import { calculateSellingPrice, calculateTotal } from "../quotation.utils";

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

  const [selectedIndex, setSelectedIndex] = useState(0);

  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  // What the user has actually typed, kept separate from `item.search` (the
  // text shown in the input). Selecting a product overwrites `item.search`
  // with the product name — if that fed the query, picking a product would
  // immediately refire the search for the thing you just picked, blanking the
  // list mid-click. Only typing moves this.
  const [query, setQuery] = useState("");

  const [debouncedQuery, setDebouncedQuery] = useState("");

  const [costPriceInput, setCostPriceInput] = useState(String(item.costPrice));

  const [marginInput, setMarginInput] = useState(String(item.marginPercent));

  const [quantityInput, setQuantityInput] = useState(String(item.quantity));

  const activeNumberFieldRef = useRef<"cost" | "margin" | "quantity" | null>(
    null,
  );

  // A freshly added row lands with the cursor already in its search box, so
  // you can add several items without reaching for the mouse.
  useEffect(() => {
    if (shouldFocus) {
      inputRef.current?.focus();
    }
  }, [shouldFocus]);

  // Every row starts on the empty query, so they all share one cache entry
  // instead of each firing its own request.
  const { data } = useProducts(debouncedQuery);

  // filter products
  const filteredProducts = useMemo(() => {
    const products = data?.items ?? [];

    const search = debouncedQuery.toLowerCase();

    if (!search.trim()) {
      return products.slice(0, 20);
    }

    return products
      .filter((p) => {
        return (
          p.name.toLowerCase().includes(search) ||
          p.sku?.toLowerCase().includes(search)
        );
      })
      .slice(0, 20);
  }, [data?.items, debouncedQuery]);

  // Position the portalled dropdown under its input. This used to run on an
  // unbroken requestAnimationFrame loop, re-rendering every frame the dropdown
  // was open; now it only recomputes when something can actually move it.
  useEffect(() => {
    if (!item.showDropdown) return;

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

    // Capture phase, so scrolling any ancestor container is caught too.
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
    const timeout = setTimeout(() => {
      setDebouncedQuery(query);
      setSelectedIndex(0);
    }, 200);

    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    if (activeNumberFieldRef.current === "cost") return;

    setCostPriceInput(String(item.costPrice));
  }, [item.costPrice]);

  useEffect(() => {
    if (activeNumberFieldRef.current === "margin") return;

    setMarginInput(String(item.marginPercent));
  }, [item.marginPercent]);

  useEffect(() => {
    if (activeNumberFieldRef.current === "quantity") return;

    setQuantityInput(String(item.quantity));
  }, [item.quantity]);

  function handleNumberFocus(field: "cost" | "margin" | "quantity") {
    activeNumberFieldRef.current = field;
  }

  function handleNumberBlur(field: "cost" | "margin" | "quantity") {
    activeNumberFieldRef.current = null;

    if (field === "cost" && costPriceInput === "") {
      setCostPriceInput("0");
    }

    if (field === "margin" && marginInput === "") {
      setMarginInput("0");
    }

    if (field === "quantity" && quantityInput === "") {
      setQuantityInput("0");
    }
  }

  // PRODUCT SELECT
  function selectProduct(product: Product) {
    const costPrice = Number(product.costPrice);

    const sellingPrice = calculateSellingPrice(costPrice, item.marginPercent);

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
      sellingPrice,
      totalPrice,
    });

    // Quantity is the only thing left to decide, so go straight there and
    // select the value — typing overwrites it instead of appending to "1".
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

    const sellingPrice = calculateSellingPrice(costPrice, item.marginPercent);

    const totalPrice = calculateTotal(sellingPrice, item.quantity);

    onUpdate(item.id, {
      costPrice,
      sellingPrice,
      totalPrice,
    });
  }

  // MARGIN
  function handleMarginChange(e: React.ChangeEvent<HTMLInputElement>) {
    const rawValue = e.target.value;

    setMarginInput(rawValue);

    const marginPercent = rawValue === "" ? 0 : Number(rawValue);

    const sellingPrice = calculateSellingPrice(item.costPrice, marginPercent);

    const totalPrice = calculateTotal(sellingPrice, item.quantity);

    onUpdate(item.id, {
      marginPercent,
      sellingPrice,
      totalPrice,
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

  // KEYBOARD NAV
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!item.showDropdown) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();

      setSelectedIndex((prev) =>
        Math.min(prev + 1, filteredProducts.length - 1),
      );
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();

      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    }

    if (e.key === "Enter") {
      e.preventDefault();

      const selected = filteredProducts[selectedIndex];

      if (selected) {
        selectProduct(selected);
      }
    }

    if (e.key === "Escape") {
      onUpdate(item.id, {
        showDropdown: false,
      });
    }
  }

  const overStock =
    item.stockQty !== undefined && item.quantity > item.stockQty;

  return (
    <tr className="border-b">
      {/* PRODUCT */}
      <td className="w-[320px] p-3 align-top">
        <div ref={wrapperRef} className="relative">
          <input
            ref={inputRef}
            value={item.search || ""}
            placeholder="Search product by name or SKU..."
            className={`w-full rounded-xl border px-3 py-2 text-sm ${
              isDuplicate ? "border-amber-400 bg-amber-50/50" : ""
            }`}
            onFocus={() =>
              onUpdate(item.id, {
                showDropdown: true,
              })
            }
            onKeyDown={handleKeyDown}
            onChange={(e) => {
              // Typing is the only thing that moves the search query.
              setQuery(e.target.value);

              onUpdate(item.id, {
                search: e.target.value,
                showDropdown: true,
              });
            }}
          />
        </div>

        {/* Confirms what was actually picked, without opening the dropdown. */}
        {item.productId && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded border bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
              {item.sku}
            </span>

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

        {item.showDropdown &&
          createPortal(
            <div
              ref={dropdownRef}
              className="absolute z-50 rounded-xl border bg-white shadow-xl"
              style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: Math.max(dropdownPosition.width, 420),
              }}
            >
              <div className="border-b bg-gray-50 px-4 py-2 text-xs">
                Product Search
              </div>

              <div className="max-h-80 overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">
                    No products found
                  </div>
                ) : (
                  filteredProducts.map((product, index) => {
                    const isActive = index === selectedIndex;

                    return (
                      <button
                        key={product.id}
                        type="button"
                        className={`flex w-full items-center justify-between gap-3 p-3 text-left ${
                          isActive ? "bg-black text-white" : "hover:bg-gray-50"
                        }`}
                        onMouseEnter={() => setSelectedIndex(index)}
                        onClick={() => selectProduct(product)}
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {product.name}
                          </div>
                          <div
                            className={`font-mono text-[11px] ${
                              isActive ? "text-gray-300" : "text-gray-500"
                            }`}
                          >
                            {product.sku}
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <div className="text-sm font-semibold">
                            ₹{Number(product.costPrice).toLocaleString("en-IN")}
                          </div>
                          <div
                            className={`text-[11px] ${
                              isActive
                                ? "text-gray-300"
                                : product.stockQty <= 0
                                  ? "text-rose-600"
                                  : product.stockQty < 20
                                    ? "text-amber-600"
                                    : "text-gray-500"
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

      {/* COST PRICE */}
      <td className="w-36 p-3">
        <input
          type="number"
          value={costPriceInput}
          className="w-full rounded border p-2"
          onFocus={() => handleNumberFocus("cost")}
          onBlur={() => handleNumberBlur("cost")}
          onChange={handleCostPriceChange}
        />
      </td>

      {/* MARGIN */}
      <td className="w-32 p-3">
        <input
          type="number"
          value={marginInput}
          className="w-full rounded border p-2"
          onFocus={() => handleNumberFocus("margin")}
          onBlur={() => handleNumberBlur("margin")}
          onChange={handleMarginChange}
        />
      </td>

      {/* SELLING PRICE */}
      <td className="w-36 p-3">
        <input
          value={item.sellingPrice}
          readOnly
          className="w-full rounded border bg-gray-50 p-2"
        />
      </td>

      {/* QUANTITY */}
      <td className="w-28 p-3 align-top">
        <input
          ref={quantityRef}
          type="number"
          min={1}
          value={quantityInput}
          className="w-full rounded border p-2"
          onFocus={() => handleNumberFocus("quantity")}
          onBlur={() => handleNumberBlur("quantity")}
          onChange={handleQuantityChange}
          onKeyDown={(e) => {
            // Enter here finishes the line and opens the next one.
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

      {/* TOTAL */}
      <td className="w-40 p-3 align-top font-semibold">
        ₹{item.totalPrice.toFixed(2)}
      </td>

      {/* DELETE */}
      <td className="w-20 p-3">
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
