import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { GitBranch, Search, Download, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";

import { api } from "../../lib/axios";
import { usePurchaseOrders, useUpdatePurchaseOrderStatus, useDeletePurchaseOrder } from "./purchase-order.query";
import type { PurchaseOrder } from "./purchase-order.types";
import { useFuzzySearch } from "../../hooks/useFuzzySearch";
import { highlightText } from "../../utils/highlight.utils";
import { downloadPurchaseOrderPDF } from "./purchase-order.pdf";

const PAGE_SIZE = 20;

const STATUS_BADGE_STYLE: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700 border-gray-200",
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  SENT: "bg-blue-50 text-blue-700 border-blue-200",
  ACKNOWLEDGED: "bg-purple-50 text-purple-700 border-purple-200",
  PARTIALLY_FULFILLED: "bg-orange-50 text-orange-700 border-orange-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
};

const ALL_STATUSES = [
  "DRAFT",
  "PENDING",
  "SENT",
  "ACKNOWLEDGED",
  "PARTIALLY_FULFILLED",
  "COMPLETED",
  "CANCELLED",
];

function DeletePODialog({ po }: { po: PurchaseOrder }) {
  const [open, setOpen] = useState(false);
  const deleteMutation = useDeletePurchaseOrder();

  const confirm = async () => {
    try {
      await deleteMutation.mutateAsync(po.id);
      toast.success("Purchase Order deleted successfully");
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete Purchase Order");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:text-rose-750 hover:bg-rose-50" title="Delete Purchase Order">
          <Trash2 size={14} />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Purchase Order</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-500">
          Are you sure you want to delete Purchase Order <strong>{po.poNumber}</strong>? This action is permanent and cannot be undone.
        </p>
        <div className="flex gap-2 justify-end mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={confirm} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PurchaseOrderList() {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const { data: rawData, isLoading } = usePurchaseOrders(1, 10000);
  const items: PurchaseOrder[] = rawData?.items ?? [];

  const updateStatusMutation = useUpdatePurchaseOrderStatus();

  // Filter by status
  const statusFiltered = useMemo(() => {
    return items.filter((po) => statusFilter === "ALL" || po.status === statusFilter);
  }, [items, statusFilter]);

  // Fuzzy Search
  const { results: searchedOrders, total } = useFuzzySearch<PurchaseOrder>({
    items: statusFiltered,
    keys: ["poNumber", "dealerNameSnapshot", "status"],
    searchQuery: search,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const visible = useMemo(() => {
    const skip = (page - 1) * PAGE_SIZE;
    return searchedOrders.slice(skip, skip + PAGE_SIZE);
  }, [searchedOrders, page]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status: newStatus });
      toast.success("Status updated successfully");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to update status");
    }
  };

  const handleDownload = async (versionId: string) => {
    const loadingToast = toast.loading("Generating PDF...");
    try {
      const response = await api.get(`/purchase-orders/${versionId}`);
      const q = response.data.data;
      downloadPurchaseOrderPDF({
        purchaseOrderNumber: q.poNumber,
        targetName: q.dealerNameSnapshot,
        payload: q,
        items: (q.items ?? []).map((item: any) => ({
          id: item.id,
          productId: item.productId,
          productName: item.product?.name || "Product",
          sku: item.product?.sku || "—",
          quantity: item.quantity,
          unit: item.product?.unit || "pcs",
          search: item.product?.name || "",
          showDropdown: false,
          sellingPrice: 0,
          totalPrice: 0,
        })),
        companyDetails: q.companyNameSnapshot
          ? {
              companyName: q.companyNameSnapshot,
              companyLogo: q.companyLogoSnapshot,
              companyGst: q.companyGstSnapshot,
              companyAddress: q.companyAddressSnapshot,
              companyPhone: q.companyPhoneSnapshot,
              companyEmail: q.companyEmailSnapshot,
              companyWebsite: q.companyWebsiteSnapshot,
              footerText: "Thank you for your business!",
            }
          : undefined,
      });
      toast.dismiss(loadingToast);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF", { id: loadingToast });
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-3.5 text-muted-foreground"
          />
          <Input
            placeholder="Search purchase orders by order number or dealer..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9 h-10 text-sm"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44 h-10 text-sm">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {ALL_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border bg-white overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[150px] font-semibold text-slate-800">PO Number</TableHead>
              <TableHead className="font-semibold text-slate-800">Supplier / Dealer</TableHead>
              <TableHead className="w-[180px] font-semibold text-slate-800">Status</TableHead>
              <TableHead className="font-semibold text-slate-800">Expected Delivery</TableHead>
              <TableHead className="font-semibold text-slate-800">Created Date</TableHead>
              <TableHead className="w-[160px] text-right font-semibold text-slate-800">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24 rounded-md" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : visible.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-muted-foreground text-sm"
                >
                  No Purchase Orders found.
                </TableCell>
              </TableRow>
            ) : (
              visible.map((po) => (
                <TableRow key={po.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-mono text-sm font-semibold text-slate-900">
                    {highlightText(po.poNumber, search)}
                  </TableCell>
                  <TableCell className="font-medium text-slate-800">
                    {highlightText(po.dealerNameSnapshot || po.dealer?.name || "—", search)}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={po.status}
                      onValueChange={(val) => handleStatusChange(po.id, val)}
                    >
                      <SelectTrigger className={`h-8 w-[160px] border px-2.5 rounded-full text-xs font-semibold ${
                        STATUS_BADGE_STYLE[po.status] || "bg-gray-100 text-gray-800"
                      }`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_STATUSES.map((status) => (
                          <SelectItem key={status} value={status} className="text-xs">
                            {status.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {new Date(po.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                        title="Download PDF"
                        onClick={() => handleDownload(po.id)}
                      >
                        <Download size={14} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                        title="Edit Purchase Order"
                        onClick={() => navigate(`/purchase-orders/${po.id}/edit`)}
                      >
                        <Edit2 size={14} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                        title="Revision History"
                        onClick={() => navigate(`/purchase-orders/${po.id}/history`)}
                      >
                        <GitBranch size={14} />
                      </Button>
                      <DeletePODialog po={po} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t bg-slate-50/50 px-4 py-3 sm:px-6">
            <div className="text-sm text-muted-foreground">
              Showing page {page} of {totalPages} ({total} entries)
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
