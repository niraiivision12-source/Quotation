import { useEffect, useState } from "react";
import { Package, Search } from "lucide-react";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

import { useAllProducts } from "./product.query";
import type { Product } from "./product.types";
import { useFuzzySearch } from "../../hooks/useFuzzySearch";
import { highlightText } from "../../utils/highlight.utils";

const PAGE_SIZES = [25, 50, 100];

const formatMoney = (value: number | string | undefined | null) =>
  value !== undefined && value !== null && Number(value) > 0
    ? `₹${Number(value).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : "—";

const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString([], {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

/** Low stock is worth flagging, but there's no threshold in settings yet. */
const stockTone = (quantity: number) => {
  if (quantity <= 0) return "text-rose-600";
  if (quantity < 20) return "text-amber-600";
  return "text-gray-900";
};

export default function ProductList() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // The API searches server-side, so don't fire a request on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const { data: allProductsData, isLoading, isFetching } = useAllProducts();
  const allProducts = allProductsData?.items ?? [];

  const { results: products, total } = useFuzzySearch({
    items: allProducts,
    keys: ["name", "sku", "brand", "category"],
    searchQuery: debouncedSearch,
    page,
    limit,
    customRankFn: (product: Product, q: string) => {
      const qLower = q.toLowerCase();
      const name = product.name.toLowerCase();
      const sku = (product.sku || "").toLowerCase();
      const brand = (product.brand || "").toLowerCase();
      const category = (product.category || "").toLowerCase();

      if (sku === qLower) return 1;
      if (name === qLower) return 2;
      if (name.startsWith(qLower)) return 3;
      if (sku.startsWith(qLower)) return 4;
      if (name.includes(qLower)) return 5;
      if (brand.includes(qLower) || category.includes(qLower)) return 6;
      return 7;
    }
  });
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const firstRow = total === 0 ? 0 : (page - 1) * limit + 1;
  const lastRow = Math.min(page * limit, total);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-3.5 text-muted-foreground"
          />
          <Input
            placeholder="Search all products by name or SKU..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9 h-10 text-sm"
          />
        </div>

        <Select
          value={String(limit)}
          onValueChange={(value) => {
            setLimit(Number(value));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-36 h-10 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size} per page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <Package size={24} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-semibold text-gray-900">
              No products found
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {debouncedSearch
                ? `Nothing matches "${debouncedSearch}".`
                : "There are no products in the catalogue yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 text-right">#</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Cost Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Tally Stock</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {products.map((product, index) => (
                  <TableRow key={product.id}>
                    <TableCell className="text-right text-[10px] text-muted-foreground tabular-nums">
                      {firstRow + index}
                    </TableCell>

                    <TableCell className="font-mono text-[11px] text-gray-900 whitespace-nowrap">
                      {highlightText(product.sku, debouncedSearch)}
                    </TableCell>

                    <TableCell className="text-xs font-medium text-gray-900">
                      {highlightText(product.name, debouncedSearch)}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {product.brand ? highlightText(product.brand, debouncedSearch) : "—"}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {product.category ? highlightText(product.category, debouncedSearch) : "—"}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {product.unit ?? "—"}
                    </TableCell>

                    <TableCell className="text-right text-xs font-semibold text-gray-900 tabular-nums whitespace-nowrap">
                      {product.costPrice && product.costPrice > 0 ? (
                        <div>
                          <span>{formatMoney(product.costPrice)}</span>
                          {product.mrp && product.mrp > 0 && (
                            <span className="text-[10px] text-muted-foreground block font-normal">
                              MRP: {formatMoney(product.mrp)}
                            </span>
                          )}
                        </div>
                      ) : product.mrp && product.mrp > 0 ? (
                        <span className="text-violet-700">MRP: {formatMoney(product.mrp)}</span>
                      ) : (
                        "—"
                      )}
                    </TableCell>

                    <TableCell
                      className={`text-right text-xs font-semibold tabular-nums ${stockTone(product.stockQty)}`}
                    >
                      {product.stockQty}
                    </TableCell>

                    <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                      {product.tallyStockQty ?? 0}
                    </TableCell>

                    <TableCell className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatDate(product.updatedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {total === 0
            ? "No products"
            : `Showing ${firstRow}–${lastRow} of ${total} products`}
          {isFetching && !isLoading && " · updating..."}
        </p>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
