import { RotateCcw, SearchCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "../../components/ui/button";
import PageHeader from "../../components/ui/PageHeader";
import { useAuthStore } from "../../store/auth.store";
import { createEmptyQuotationRow } from "../quotation/quotation.utils";
import type { QuotationItemForm } from "../quotation/quotation.types";
import { useCreatePurchaseOrder, usePurchaseOrder, useUpdatePurchaseOrder } from "./purchase-order.query";
import { getUsers } from "../user/user.api";

import PurchaseOrderItemsTable from "./components/PurchaseOrderItemsTable";
import PurchaseOrderInfoCard from "./components/PurchaseOrderInfoCard";
import PurchaseOrderPreviewDialog from "./components/PurchaseOrderPreviewDialog";
import { downloadPurchaseOrderPDF } from "./purchase-order.pdf";
import type { CreatePurchaseOrderDTO } from "./purchase-order.types";

export default function PurchaseOrderPageMain() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);

  // States
  const [dealerId, setDealerId] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<QuotationItemForm[]>([createEmptyQuotationRow()]);
  const [focusRowId, setFocusRowId] = useState<string | null>(null);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewPayload, setPreviewPayload] = useState<CreatePurchaseOrderDTO | null>(null);
  const [previewDetails, setPreviewDetails] = useState<{ targetName?: string }>({});

  const [users, setUsers] = useState<any[]>([]);
  const [billingUserId, setBillingUserId] = useState("");

  const createMutation = useCreatePurchaseOrder();
  const updateMutation = useUpdatePurchaseOrder();
  const { data: existingPO, isLoading: isPoLoading } = usePurchaseOrder(id);

  // Prepopulate form if in edit mode
  useEffect(() => {
    if (isEditMode && existingPO) {
      setDealerId(existingPO.dealerId);
      setExpectedDeliveryDate(
        existingPO.expectedDeliveryDate
          ? new Date(existingPO.expectedDeliveryDate).toISOString().substring(0, 10)
          : ""
      );
      setDeliveryAddress(existingPO.deliveryAddress || "");
      setNotes(existingPO.notes || "");
      setItems(
        existingPO.items.map((item: any) => ({
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
        }))
      );
    }
  }, [isEditMode, existingPO]);

  // Load company users to assign as owner
  useEffect(() => {
    async function loadUsers() {
      try {
        const response = await getUsers(1, 1000);
        const list = response.items ?? [];
        setUsers(list);
        if (currentUser?.id) setBillingUserId(currentUser.id);
      } catch (error) {
        console.error(error);
      }
    }
    loadUsers();
  }, [currentUser]);

  const handlePreviewDetailsChange = useCallback(
    (details: { targetName?: string }) => {
      setPreviewDetails((prev) => ({ ...prev, ...details }));
    },
    [],
  );

  function handleAddRow() {
    const row = createEmptyQuotationRow();
    setItems((prev) => [...prev, row]);
    setFocusRowId(row.id);
  }

  function handleRemoveRow(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function handleUpdateRow(id: string, updates: Partial<QuotationItemForm>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  }

  function handleReset() {
    if (isEditMode && existingPO) {
      setDealerId(existingPO.dealerId);
      setExpectedDeliveryDate(
        existingPO.expectedDeliveryDate
          ? new Date(existingPO.expectedDeliveryDate).toISOString().substring(0, 10)
          : ""
      );
      setDeliveryAddress(existingPO.deliveryAddress || "");
      setNotes(existingPO.notes || "");
      setItems(
        existingPO.items.map((item: any) => ({
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
        }))
      );
    } else {
      setDealerId("");
      setExpectedDeliveryDate("");
      setDeliveryAddress("");
      setNotes("");
      setItems([createEmptyQuotationRow()]);
    }
    setPreviewPayload(null);
    setIsPreviewOpen(false);
    setPreviewDetails({});
    if (currentUser?.id) setBillingUserId(currentUser.id);
  }

  function buildPayload() {
    if (!dealerId) {
      toast.error("Please select a dealer");
      return null;
    }

    const validItems = items.filter((item) => item.productId);
    if (validItems.length === 0) {
      toast.error("Add at least one product to the purchase order");
      return null;
    }

    return {
      dealerId,
      expectedDeliveryDate: expectedDeliveryDate || undefined,
      deliveryAddress: deliveryAddress || undefined,
      notes,
      createdById: billingUserId || currentUser?.id,
      items: validItems.map((item) => ({
        productId: item.productId!,
        quantity: item.quantity,
      })),
    } satisfies CreatePurchaseOrderDTO;
  }

  function handlePreview() {
    const payload = buildPayload();
    if (!payload) return;
    setPreviewPayload(payload);
    setIsPreviewOpen(true);
  }

  async function handleConfirmCreate() {
    if (!previewPayload) return;
    try {
      let response;
      if (isEditMode) {
        response = await updateMutation.mutateAsync({ id: id!, data: previewPayload });
      } else {
        response = await createMutation.mutateAsync(previewPayload);
      }
      downloadPurchaseOrderPDF({
        purchaseOrderNumber: response?.poNumber ?? `PO-${Date.now()}`,
        targetName: previewDetails.targetName,
        payload: response,
        items: response.items.map((item: any) => ({
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
        companyDetails: response?.companyNameSnapshot
          ? {
              companyName: response.companyNameSnapshot,
              companyLogo: response.companyLogoSnapshot,
              companyGst: response.companyGstSnapshot,
              companyAddress: response.companyAddressSnapshot,
              companyPhone: response.companyPhoneSnapshot,
              companyEmail: response.companyEmailSnapshot,
              companyWebsite: response.companyWebsiteSnapshot,
              footerText: "Thank you for your business!",
            }
          : undefined,
      });
      toast.success(isEditMode ? "Purchase Order updated successfully" : "Purchase Order created successfully");
      handleReset();
      navigate("/purchase-orders/history");
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to save Purchase Order");
    }
  }

  if (isEditMode && isPoLoading) {
    return <div className="p-8 text-center text-sm text-slate-500">Loading Purchase Order details...</div>;
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <PageHeader
        title={isEditMode ? `Edit Purchase Order: ${existingPO?.poNumber}` : "New Purchase Order"}
        description={isEditMode ? "Modify parameters and quantities of this purchase order." : "Place an order sheet to a dealer to purchase inventory."}
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        {/* Left Side: Items and Contact Info */}
        <div className="min-w-0 space-y-5">
          <PurchaseOrderItemsTable
            items={items}
            onUpdate={handleUpdateRow}
            onRemove={handleRemoveRow}
            onAddRow={handleAddRow}
            focusRowId={focusRowId}
          />

          <PurchaseOrderInfoCard
            dealerId={dealerId}
            onDealerChange={setDealerId}
            expectedDeliveryDate={expectedDeliveryDate}
            onExpectedDeliveryDateChange={setExpectedDeliveryDate}
            deliveryAddress={deliveryAddress}
            onDeliveryAddressChange={setDeliveryAddress}
            notes={notes}
            onNotesChange={setNotes}
            onPreviewDetailsChange={handlePreviewDetailsChange}
          />
        </div>

        {/* Right Side: Quick Action Sidebar */}
        <div className="space-y-5">
          <div className="rounded-xl border bg-white p-5 space-y-4 shadow-xs">
            <h3 className="font-semibold text-slate-800 text-sm border-b pb-2">Purchase Order Actions</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Verify all products and dealer details. Click Preview to review the order sheet before export.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="outline" onClick={handleReset} className="h-9 text-xs">
                <RotateCcw size={13} className="mr-1" /> Reset
              </Button>
              <Button type="button" disabled={createMutation.isPending || updateMutation.isPending} onClick={handlePreview} className="h-9 text-xs">
                <SearchCheck size={13} className="mr-1" /> Preview
              </Button>
            </div>
          </div>
        </div>
      </div>

      <PurchaseOrderPreviewDialog
        open={isPreviewOpen}
        payload={previewPayload}
        dealerName={previewDetails.targetName}
        items={items}
        users={users}
        isCreating={createMutation.isPending || updateMutation.isPending}
        onOpenChange={setIsPreviewOpen}
        onConfirm={handleConfirmCreate}
      />
    </div>
  );
}
