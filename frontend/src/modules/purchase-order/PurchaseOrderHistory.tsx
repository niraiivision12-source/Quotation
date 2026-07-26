import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Download, Eye } from "lucide-react";
import { toast } from "sonner";

import { Button } from "../../components/ui/button";
import PageHeader from "../../components/ui/PageHeader";
import { Skeleton } from "../../components/ui/skeleton";
import { api } from "../../lib/axios";
import { usePurchaseOrderHistory, usePurchaseOrder, useUpdatePurchaseOrderStatus } from "./purchase-order.query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

import PurchaseOrderPreviewDialog from "./components/PurchaseOrderPreviewDialog";
import { downloadPurchaseOrderPDF } from "./purchase-order.pdf";

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

export default function PurchaseOrderHistory() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [selectedPreviewPO, setSelectedPreviewPO] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { data: purchaseOrder } = usePurchaseOrder(id);
  const { data: versions = [], isLoading: isHistoryLoading, refetch } = usePurchaseOrderHistory(id);

  const updateStatusMutation = useUpdatePurchaseOrderStatus();

  // Newest first, so the current version reads at the top.
  const ordered = [...versions].sort((a, b) => b.version - a.version);
  const rootNumber = purchaseOrder?.poNumber ?? "";

  const handleStatusChange = async (versionId: string, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id: versionId, status: newStatus });
      toast.success("Status updated successfully");
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to update status");
    }
  };

  const handlePreview = async (versionId: string) => {
    const loadingToast = toast.loading("Loading preview details...");
    try {
      const response = await api.get(`/purchase-orders/${versionId}`);
      setSelectedPreviewPO(response.data.data);
      setIsPreviewOpen(true);
      toast.dismiss(loadingToast);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load details", { id: loadingToast });
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
          productName: item.product?.name,
          sku: item.product?.sku,
          quantity: item.quantity,
          unit: item.product?.unit,
          search: item.product?.name,
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
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-slate-500 hover:text-slate-900"
          onClick={() => navigate("/purchase-orders/history")}
        >
          &larr; Back to History
        </Button>
      </div>

      <PageHeader
        title={`Purchase Order Revisions for ${rootNumber || "PO"}`}
        description="View past versions and revisions of this purchase order."
      />

      {isHistoryLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      ) : ordered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground text-sm bg-white">
          No revision history found for this Purchase Order.
        </div>
      ) : (
        <div className="space-y-3">
          {ordered.map((version) => {
            const isLatest = version.version === Math.max(...versions.map((v) => v.version));
            return (
              <div
                key={version.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border bg-white shadow-xs hover:border-slate-350 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800 text-sm">Version {version.version}</span>
                    {isLatest && (
                      <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                        LATEST
                      </span>
                    )}
                    
                    <Select
                      value={version.status}
                      onValueChange={(val) => handleStatusChange(version.id, val)}
                    >
                      <SelectTrigger className={`h-6 w-[140px] border px-2.5 rounded-full text-[10px] font-semibold ${
                        STATUS_BADGE_STYLE[version.status] || "bg-gray-100 text-gray-800"
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
                  </div>
                  <div className="text-xs text-slate-500">
                    Created: {new Date(version.createdAt).toLocaleString()} by {version.createdBy?.name || "Unknown"}
                  </div>
                  {version.revisionReason && (
                    <div className="text-xs text-amber-800 font-medium">
                      Reason: {version.revisionReason}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    onClick={() => handlePreview(version.id)}
                  >
                    <Eye size={12} className="mr-1" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    onClick={() => handleDownload(version.id)}
                  >
                    <Download size={12} className="mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedPreviewPO && (
        <PurchaseOrderPreviewDialog
          open={isPreviewOpen}
          payload={{
            dealerId: selectedPreviewPO.dealerId,
            expectedDeliveryDate: selectedPreviewPO.expectedDeliveryDate,
            deliveryAddress: selectedPreviewPO.deliveryAddress,
            notes: selectedPreviewPO.notes,
            items: selectedPreviewPO.items,
            createdById: selectedPreviewPO.createdById,
          }}
          dealerName={
            selectedPreviewPO.dealerNameSnapshot ||
            selectedPreviewPO.dealer?.name
          }
          items={selectedPreviewPO.items.map((item: any) => ({
            id: item.id,
            productId: item.productId,
            productName: item.product?.name || "",
            sku: item.product?.sku || "",
            quantity: item.quantity,
            unit: item.product?.unit || "",
            search: item.product?.name || "",
            showDropdown: false,
            sellingPrice: 0,
            totalPrice: 0,
          }))}
          users={selectedPreviewPO.createdBy ? [selectedPreviewPO.createdBy] : []}
          isCreating={false}
          onOpenChange={setIsPreviewOpen}
          readOnly={true}
        />
      )}
    </div>
  );
}
