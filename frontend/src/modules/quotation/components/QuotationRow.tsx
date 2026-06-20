import { Trash2 } from "lucide-react";

import { useEffect, useMemo, useRef, useState } from "react";

import { createPortal } from "react-dom";

import { useProducts } from "@/modules/product/product.query";

import type { Product } from "@/modules/product/product.types";

import type { QuotationItemForm } from "../quotation.types";

import { calculateSellingPrice, calculateTotal } from "../quotation.utils";

interface Props {
  item: QuotationItemForm;

  onUpdate: (id: string, updates: Partial<QuotationItemForm>) => void;

  onRemove: (id: string) => void;
}

export default function QuotationRow({ item, onUpdate, onRemove }: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [selectedIndex, setSelectedIndex] = useState(0);

  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const [debouncedSearch, setDebouncedSearch] = useState(item.search || "");

  // fetch products
  const { data } = useProducts(debouncedSearch);

  // filter products
  const filteredProducts = useMemo(() => {
    const products = data?.items ?? [];

    const search = debouncedSearch.toLowerCase();

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
  }, [data?.items, debouncedSearch]);

  // dropdown position tracking
  useEffect(() => {
    let frameId: number;

    function updatePosition() {
      if (item.showDropdown && inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();

        setDropdownPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }

      frameId = requestAnimationFrame(updatePosition);
    }

    updatePosition();

    return () => cancelAnimationFrame(frameId);
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
      setDebouncedSearch(item.search || "");
      setSelectedIndex(0); // ✅ reset here instead
    }, 200);

    return () => clearTimeout(timeout);
  }, [item.search]);

  // PRODUCT SELECT
  function selectProduct(product: Product) {
    const costPrice = Number(product.costPrice);

    const sellingPrice = calculateSellingPrice(costPrice, item.marginPercent);

    const totalPrice = calculateTotal(sellingPrice, item.quantity);

    onUpdate(item.id, {
      productId: product.id,
      productName: product.name,
      sku: product.sku,

      search: product.name,
      showDropdown: false,

      costPrice,
      sellingPrice,
      totalPrice,
    });
  }

  // COST PRICE
  function handleCostPriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const costPrice = Number(e.target.value);

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
    const marginPercent = Number(e.target.value);

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
    const quantity = Number(e.target.value);

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

  return (
    <tr className="border-b">
      {/* PRODUCT */}
      <td className="w-[320px] p-3 align-top">
        <div ref={wrapperRef} className="relative">
          <input
            ref={inputRef}
            value={item.search || ""}
            placeholder="Search product..."
            className="w-full rounded-xl border px-3 py-2 text-sm"
            onFocus={() =>
              onUpdate(item.id, {
                showDropdown: true,
              })
            }
            onKeyDown={handleKeyDown}
            onChange={(e) =>
              onUpdate(item.id, {
                search: e.target.value,
                showDropdown: true,
              })
            }
          />
        </div>

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
                  filteredProducts.map((product, index) => (
                    <button
                      key={product.id}
                      type="button"
                      className={`w-full p-3 text-left ${
                        index === selectedIndex
                          ? "bg-black text-white"
                          : "hover:bg-gray-50"
                      }`}
                      onMouseEnter={() => setSelectedIndex(index)}
                      onClick={() => selectProduct(product)}
                    >
                      <div className="font-medium">{product.name}</div>
                      <div className="text-xs">SKU: {product.sku}</div>
                    </button>
                  ))
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
          value={item.costPrice}
          className="w-full rounded border p-2"
          onChange={handleCostPriceChange}
        />
      </td>

      {/* MARGIN */}
      <td className="w-32 p-3">
        <input
          type="number"
          value={item.marginPercent}
          className="w-full rounded border p-2"
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
      <td className="w-28 p-3">
        <input
          type="number"
          value={item.quantity}
          className="w-full rounded border p-2"
          onChange={handleQuantityChange}
        />
      </td>

      {/* TOTAL */}
      <td className="w-40 p-3 font-semibold">{item.totalPrice.toFixed(2)}</td>

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
