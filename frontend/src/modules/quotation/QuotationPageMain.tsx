import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { toast } from "sonner";

import { RotateCcw, SearchCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/axios";

import QuotationInfoCard from "./components/QuotationInfoCard";
import QuotationItemsTable from "./components/QuotationItemsTable";
import QuotationPreviewDialog from "./components/QuotationPreviewDialog";

import { useCreateQuotation } from "./quotation.query";

import type {
  CreateQuotationDTO,
  ProjectPhase,
  QuotationItemForm,
} from "./quotation.types";

import { useAuthStore } from "@/store/auth.store";
import { downloadQuotationPDF } from "./quotation.pdf";
import { createEmptyQuotationRow } from "./quotation.utils";

interface User {
  id: string;
  name: string;
  role: string;
}

export default function QuotationPageMain() {
  const createMutation = useCreateQuotation();
  const currentUser = useAuthStore((state) => state.user);
  const [searchParams, setSearchParams] = useSearchParams();

  const [quotationType, setQuotationType] = useState<"LEAD" | "CUSTOMER">(
    "LEAD",
  );

  const [leadId, setLeadId] = useState(() => searchParams.get("leadId") ?? "");

  const [customerId, setCustomerId] = useState("");

  const [projectId, setProjectId] = useState("");

  const [phase, setPhase] = useState<ProjectPhase | undefined>();

  const [validUntil, setValidUntil] = useState("");

  const [notes, setNotes] = useState("");

  const [discountAmount, setDiscountAmount] = useState(0);

  const [discountInput, setDiscountInput] = useState("0");

  const isDiscountFocusedRef = useRef(false);

  const [items, setItems] = useState<QuotationItemForm[]>([
    createEmptyQuotationRow(),
  ]);

  const [users, setUsers] = useState<User[]>([]);

  const [billingUserId, setBillingUserId] = useState("");

  const [previewPayload, setPreviewPayload] =
    useState<CreateQuotationDTO | null>(null);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [previewDetails, setPreviewDetails] = useState<{
    targetName?: string;
    projectName?: string;
  }>({});

  useEffect(() => {
    if (searchParams.get("leadId")) {
      setSearchParams({}, { replace: true });
    }
  }, []);

  useEffect(() => {
    async function loadUsers() {
      try {
        const response = await api.get("/users");

        const items = response.data.data.items ?? [];

        setUsers(items);

        // Set the logged-in user as the default owner
        if (currentUser?.id) {
          setBillingUserId(currentUser.id);
        }
      } catch (error) {
        console.error(error);
      }
    }

    loadUsers();
  }, [currentUser]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [items]);

  const totalAmount = Math.max(subtotal - discountAmount, 0);

  useEffect(() => {
    if (isDiscountFocusedRef.current) return;

    setDiscountInput(String(discountAmount));
  }, [discountAmount]);

  const handlePreviewDetailsChange = useCallback(
    (details: { targetName?: string; projectName?: string }) => {
      setPreviewDetails((prev) => ({
        ...prev,
        ...details,
      }));
    },
    [],
  );

  function handleAddRow() {
    setItems((prev) => [...prev, createEmptyQuotationRow()]);
  }

  function handleRemoveRow(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function handleUpdateRow(id: string, updates: Partial<QuotationItemForm>) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...updates,
            }
          : item,
      ),
    );
  }

  function handleReset() {
    setQuotationType("LEAD");

    setLeadId("");

    setCustomerId("");

    setProjectId("");

    setPhase(undefined);

    setValidUntil("");

    setNotes("");

    setDiscountAmount(0);

    setDiscountInput("0");

    setBillingUserId(currentUser?.id ?? "");

    setItems([createEmptyQuotationRow()]);

    setPreviewPayload(null);

    setIsPreviewOpen(false);

    setPreviewDetails({});
  }

  function handleQuotationTypeChange(value: "LEAD" | "CUSTOMER") {
    setQuotationType(value);
    setLeadId("");
    setCustomerId("");
    setProjectId("");
    setPreviewDetails({});
  }

  function handleDiscountChange(value: string) {
    setDiscountInput(value);
    setDiscountAmount(value === "" ? 0 : Number(value));
  }

  function handleDiscountBlur() {
    isDiscountFocusedRef.current = false;

    if (discountInput === "") {
      setDiscountInput("0");
    }
  }

  function buildQuotationPayload() {
    if (!phase) {
      toast.error("Select quotation phase");
      return null;
    }

    if (!billingUserId) {
      toast.error("Select quotation owner");
      return null;
    }

    if (quotationType === "LEAD" && !leadId) {
      toast.error("Select a lead");
      return null;
    }

    if (quotationType === "CUSTOMER" && !customerId) {
      toast.error("Select a customer");
      return null;
    }

    const validItems = items.filter((item) => item.productId);

    if (validItems.length === 0) {
      toast.error("Add at least one product");
      return null;
    }

    return {
      leadId: quotationType === "LEAD" ? leadId : undefined,
      customerId: quotationType === "CUSTOMER" ? customerId : undefined,
      projectId: quotationType === "CUSTOMER" ? projectId : undefined,
      phase,
      notes,
      validUntil: validUntil || undefined,
      createdById: billingUserId,
      items: validItems.map((item) => ({
        productId: item.productId!,
        quantity: item.quantity,
        marginPercent: item.marginPercent,
      })),
    } satisfies CreateQuotationDTO;
  }

  function handlePreview() {
    const payload = buildQuotationPayload();

    if (!payload) return;

    setPreviewPayload(payload);
    setIsPreviewOpen(true);
  }

  async function handleConfirmCreate() {
    if (!previewPayload) return;

    try {
      const quotation = await createMutation.mutateAsync(previewPayload);

      downloadQuotationPDF({
        quotationNumber: quotation?.quotationNumber ?? `QT-${Date.now()}`,
        quotationType,
        targetName: previewDetails.targetName,
        projectName: previewDetails.projectName,
        payload: previewPayload,
        items,
        subtotal,
        discountAmount,
        totalAmount,
      });

      toast.success("Quotation created");

      handleReset();
    } catch (error) {
      console.error(error);

      toast.error("Failed to create quotation");
    }
  }

  return (
    <div className="min-h-full max-w-full overflow-hidden">
      <div className="mx-auto grid w-full max-w-400 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <QuotationInfoCard
            quotationType={quotationType}
            onQuotationTypeChange={handleQuotationTypeChange}
            leadId={leadId}
            customerId={customerId}
            projectId={projectId}
            phase={phase}
            validUntil={validUntil}
            notes={notes}
            onLeadChange={setLeadId}
            onCustomerChange={setCustomerId}
            onProjectChange={setProjectId}
            onPhaseChange={(value) => setPhase(value as ProjectPhase)}
            onValidUntilChange={setValidUntil}
            onNotesChange={setNotes}
            onPreviewDetailsChange={handlePreviewDetailsChange}
          />
        </div>

        <div className="min-w-0 rounded-lg border bg-white p-4 shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-semibold">Summary</h2>
            <p className="text-sm text-muted-foreground">
              Owner, totals, and final action
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Quotation Owner</label>
              <select
                value={billingUserId}
                className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                onChange={(e) => setBillingUserId(e.target.value)}
              >
                <option value="">Select User</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3 rounded-lg border bg-slate-50 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">₹ {subtotal.toFixed(2)}</span>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">
                  Discount
                </label>
                <input
                  type="number"
                  min={0}
                  value={discountInput}
                  className="mt-1 h-10 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-black"
                  onFocus={() => {
                    isDiscountFocusedRef.current = true;
                  }}
                  onBlur={handleDiscountBlur}
                  onChange={(e) => handleDiscountChange(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between border-t pt-3">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold">
                  ₹ {totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-10"
                onClick={handleReset}
              >
                <RotateCcw />
                Reset
              </Button>

              <Button
                type="button"
                className="h-10"
                disabled={createMutation.isPending}
                onClick={handlePreview}
              >
                <SearchCheck />
                Preview
              </Button>
            </div>
          </div>
        </div>

        <div className="min-w-0 xl:col-span-2">
          <QuotationItemsTable
            items={items}
            onUpdate={handleUpdateRow}
            onRemove={handleRemoveRow}
            onAddRow={handleAddRow}
          />
        </div>
      </div>

      <QuotationPreviewDialog
        open={isPreviewOpen}
        payload={previewPayload}
        quotationType={quotationType}
        targetName={previewDetails.targetName}
        projectName={previewDetails.projectName}
        items={items}
        users={users}
        subtotal={subtotal}
        discountAmount={discountAmount}
        totalAmount={totalAmount}
        isCreating={createMutation.isPending}
        onOpenChange={setIsPreviewOpen}
        onConfirm={handleConfirmCreate}
      />
    </div>
  );
}
