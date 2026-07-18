import { useEffect, useState, useRef } from "react";
import { Package, Search, Upload, Edit } from "lucide-react";
import { toast } from "sonner";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";

import { useProductList, useUpdateProduct } from "./product.query";
import { highlightText } from "../../utils/highlight.utils";
import ProductImportModal from "./ProductImportModal";

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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const [focusedRowIndex, setFocusedRowIndex] = useState<number | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form states for manual editing
  const [editName, setEditName] = useState("");
  const [editSku, setEditSku] = useState("");
  const [editBrand, setEditBrand] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [editCostPrice, setEditCostPrice] = useState("");
  const [editMrp, setEditMrp] = useState("");
  const [editStockQty, setEditStockQty] = useState("");

  const updateProductMutation = useUpdateProduct();

  const handleOpenEditModal = (product: any) => {
    setSelectedProduct(product);
    setEditName(product.name ?? "");
    setEditSku(product.sku ?? "");
    setEditBrand(product.brand ?? "");
    setEditCategory(product.category ?? "");
    setEditUnit(product.unit ?? "");
    setEditCostPrice(product.costPrice !== null && product.costPrice !== undefined ? String(product.costPrice) : "");
    setEditMrp(product.mrp !== null && product.mrp !== undefined ? String(product.mrp) : "");
    setEditStockQty(product.stockQty !== null && product.stockQty !== undefined ? String(product.stockQty) : "0");
    setIsEditModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (!editSku.trim()) {
      toast.error("SKU is required");
      return;
    }
    if (!editName.trim()) {
      toast.error("Product Name is required");
      return;
    }

    try {
      await updateProductMutation.mutateAsync({
        id: selectedProduct.id,
        payload: {
          sku: editSku.trim(),
          name: editName.trim(),
          brand: editBrand.trim() || null,
          category: editCategory.trim() || null,
          unit: editUnit.trim() || null,
          costPrice: editCostPrice.trim() !== "" ? Number(editCostPrice) : null,
          mrp: editMrp.trim() !== "" ? Number(editMrp) : null,
          stockQty: editStockQty.trim() !== "" ? Number(editStockQty) : 0,
        },
      });
      toast.success("Product updated successfully");
      setIsEditModalOpen(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update product");
    }
  };

  // The API searches server-side, so don't fire a request on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const [stockStatus, setStockStatus] = useState("all");
  const [priceStatus, setPriceStatus] = useState("all");

  const { data: productListData, isLoading, isFetching } = useProductList(
    page,
    limit,
    debouncedSearch,
    stockStatus === "all" ? "" : stockStatus,
    priceStatus === "all" ? "" : priceStatus
  );
  const products = productListData?.items ?? [];
  const total = productListData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  useEffect(() => {
    setFocusedRowIndex(null);
  }, [search, page, limit, stockStatus, priceStatus]);

  useKeyboardShortcuts(
    [
      {
        id: "prod-focus-search",
        keys: "/",
        description: "Focus search bar",
        category: "Product Management",
        action: (e) => {
          if (isEditModalOpen || isImportModalOpen) return;
          e.preventDefault();
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        },
      },
      {
        id: "prod-prev-page",
        keys: "alt+arrowleft",
        description: "Previous page",
        category: "Product Management",
        action: () => {
          if (isEditModalOpen || isImportModalOpen) return;
          if (page > 1) setPage((p) => p - 1);
        },
      },
      {
        id: "prod-next-page",
        keys: "alt+arrowright",
        description: "Next page",
        category: "Product Management",
        action: () => {
          if (isEditModalOpen || isImportModalOpen) return;
          if (page < totalPages) setPage((p) => p + 1);
        },
      },
      {
        id: "prod-row-down",
        keys: "arrowdown",
        description: "Select next row",
        category: "Product Management",
        allowInInputs: true,
        action: (e) => {
          if (isEditModalOpen || isImportModalOpen) return;
          if (products.length === 0) return;
          e.preventDefault();
          setFocusedRowIndex((prev) => {
            if (prev === null) return 0;
            return Math.min(prev + 1, products.length - 1);
          });
        },
      },
      {
        id: "prod-row-up",
        keys: "arrowup",
        description: "Select previous row",
        category: "Product Management",
        allowInInputs: true,
        action: (e) => {
          if (isEditModalOpen || isImportModalOpen) return;
          if (products.length === 0) return;
          e.preventDefault();
          setFocusedRowIndex((prev) => {
            if (prev === null || prev === 0) return null;
            return prev - 1;
          });
        },
      },
      {
        id: "prod-row-enter",
        keys: "enter",
        description: "Edit selected product",
        category: "Product Management",
        allowInInputs: true,
        action: (e) => {
          if (isEditModalOpen || isImportModalOpen) return;
          if (focusedRowIndex !== null && products[focusedRowIndex]) {
            e.preventDefault();
            handleOpenEditModal(products[focusedRowIndex]);
          }
        },
      },
    ],
    [products, page, totalPages, focusedRowIndex, isEditModalOpen, isImportModalOpen]
  );

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
            ref={searchInputRef}
            placeholder="Search all products by name or SKU..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9 h-10 text-sm"
          />
        </div>

        <Select
          value={stockStatus}
          onValueChange={(value) => {
            setStockStatus(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-44 h-10 text-sm">
            <SelectValue placeholder="Stock Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stock Statuses</SelectItem>
            <SelectItem value="inStock">In Stock (Qty &gt; 0)</SelectItem>
            <SelectItem value="outOfStock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={priceStatus}
          onValueChange={(value) => {
            setPriceStatus(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-44 h-10 text-sm">
            <SelectValue placeholder="Price Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Pricing</SelectItem>
            <SelectItem value="hasPrice">With Pricing</SelectItem>
            <SelectItem value="noPrice">Without Pricing</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={String(limit)}
          onValueChange={(value) => {
            setLimit(Number(value));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-32 h-10 text-sm">
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

        <Button
          onClick={() => setIsImportModalOpen(true)}
          className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Upload size={14} />
          Import Products
        </Button>
      </div>

      <ProductImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />


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
                  <TableHead className="w-16 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {products.map((product, index) => (
                  <TableRow 
                    key={product.id}
                    className={
                      index === focusedRowIndex
                        ? "bg-slate-100/80 hover:bg-slate-100/80 ring-2 ring-indigo-500/10"
                        : ""
                    }
                  >
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

                    <TableCell className="text-center p-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEditModal(product)}
                        className="h-7 w-7 text-gray-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50/50 cursor-pointer flex items-center justify-center mx-auto"
                        title="Edit Product"
                      >
                        <Edit size={13} />
                      </Button>
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

      {/* Edit Product Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-white rounded-2xl shadow-xl border border-gray-150">
          <DialogHeader className="p-6 pb-4 border-b border-gray-100 bg-gray-50/50">
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Package className="text-indigo-600" size={18} />
              Edit Product Details
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveProduct}>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label htmlFor="edit-name" className="text-xs font-semibold text-gray-700">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="edit-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. Havells Motor 3Ph"
                    className="h-10 text-xs rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="edit-sku" className="text-xs font-semibold text-gray-700">
                    SKU / Code <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="edit-sku"
                    value={editSku}
                    onChange={(e) => setEditSku(e.target.value)}
                    placeholder="e.g. SKU-12345"
                    className="h-10 text-xs rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="edit-unit" className="text-xs font-semibold text-gray-700">
                    Unit (UoM)
                  </label>
                  <Input
                    id="edit-unit"
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    placeholder="e.g. Box, No., Pcs"
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="edit-brand" className="text-xs font-semibold text-gray-700">
                    Brand
                  </label>
                  <Input
                    id="edit-brand"
                    value={editBrand}
                    onChange={(e) => setEditBrand(e.target.value)}
                    placeholder="e.g. Havells"
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="edit-category" className="text-xs font-semibold text-gray-700">
                    Category
                  </label>
                  <Input
                    id="edit-category"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    placeholder="e.g. Electrical"
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="edit-cost" className="text-xs font-semibold text-gray-700">
                    Cost Price (₹)
                  </label>
                  <Input
                    id="edit-cost"
                    type="number"
                    step="any"
                    value={editCostPrice}
                    onChange={(e) => setEditCostPrice(e.target.value)}
                    placeholder="0.00"
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="edit-mrp" className="text-xs font-semibold text-gray-700">
                    MRP (₹)
                  </label>
                  <Input
                    id="edit-mrp"
                    type="number"
                    step="any"
                    value={editMrp}
                    onChange={(e) => setEditMrp(e.target.value)}
                    placeholder="0.00"
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label htmlFor="edit-stock" className="text-xs font-semibold text-gray-700">
                    Stock Quantity
                  </label>
                  <Input
                    id="edit-stock"
                    type="number"
                    value={editStockQty}
                    onChange={(e) => setEditStockQty(e.target.value)}
                    placeholder="0"
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="p-4 border-t border-gray-100 bg-gray-50/50 flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                className="h-9 px-4 rounded-xl text-xs font-semibold"
                disabled={updateProductMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold"
                disabled={updateProductMutation.isPending}
              >
                {updateProductMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
