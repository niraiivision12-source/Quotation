import { useEffect, useMemo, useState } from "react";

import { toast } from "sonner";

import { api } from "@/lib/axios";

import QuotationActions from "./components/QuotationActions";
import QuotationInfoCard from "./components/QuotationInfoCard";
import QuotationItemsTable from "./components/QuotationItemsTable";
import QuotationSummary from "./components/QuotationSummary";

import { useCreateQuotation } from "./quotation.query";

import type {
  CreateQuotationDTO,
  ProjectPhase,
  QuotationItemForm,
} from "./quotation.types";

import { createEmptyQuotationRow } from "./quotation.utils";

interface User {
  id: string;
  name: string;
  role: string;
}

export default function QuotationPageMain() {
  const createMutation = useCreateQuotation();

  const [quotationType, setQuotationType] = useState<"LEAD" | "CUSTOMER">(
    "LEAD",
  );

  const [leadId, setLeadId] = useState("");

  const [customerId, setCustomerId] = useState("");

  const [projectId, setProjectId] = useState("");

  const [phase, setPhase] = useState<ProjectPhase | undefined>();

  const [validUntil, setValidUntil] = useState("");

  const [notes, setNotes] = useState("");

  const [discountAmount, setDiscountAmount] = useState(0);

  const [items, setItems] = useState<QuotationItemForm[]>([
    createEmptyQuotationRow(),
  ]);

  const [users, setUsers] = useState<User[]>([]);

  const [billingUserId, setBillingUserId] = useState("");

  useEffect(() => {
    async function loadUsers() {
      try {
        const response = await api.get("/users");

        setUsers(response.data.data.items ?? []);
      } catch (error) {
        console.error(error);
      }
    }

    loadUsers();
  }, []);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [items]);

  const totalAmount = subtotal - discountAmount;

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

    setBillingUserId("");

    setItems([createEmptyQuotationRow()]);
  }

  async function handleSave() {
    try {
      if (!phase) {
        toast.error("Select quotation phase");
        return;
      }

      if (!billingUserId) {
        toast.error("Select quotation owner");
        return;
      }

      if (quotationType === "LEAD" && !leadId) {
        toast.error("Select a lead");
        return;
      }

      if (quotationType === "CUSTOMER" && !customerId) {
        toast.error("Select a customer");
        return;
      }

      const validItems = items.filter((item) => item.productId);

      if (validItems.length === 0) {
        toast.error("Add at least one product");
        return;
      }

      const payload: CreateQuotationDTO = {
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
      };

      await createMutation.mutateAsync(payload);

      toast.success("Quotation created");

      handleReset();
    } catch (error) {
      console.error(error);

      toast.error("Failed to create quotation");
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <QuotationInfoCard
            quotationType={quotationType}
            onQuotationTypeChange={setQuotationType}
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
          />

          <QuotationItemsTable
            items={items}
            onUpdate={handleUpdateRow}
            onRemove={handleRemoveRow}
            onAddRow={handleAddRow}
          />
        </div>

        <div className="space-y-6">
          <QuotationSummary
            subtotal={subtotal}
            discountAmount={discountAmount}
            onDiscountChange={setDiscountAmount}
          />

          <QuotationActions
            billingUserId={billingUserId}
            users={users}
            isSaving={createMutation.isPending}
            onBillingUserChange={setBillingUserId}
            onSave={handleSave}
            onReset={handleReset}
          />

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>

              <span>{subtotal.toFixed(2)}</span>
            </div>

            <div className="mt-2 flex justify-between">
              <span className="text-muted-foreground">Discount</span>

              <span>{discountAmount.toFixed(2)}</span>
            </div>

            <div className="mt-4 border-t pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>

                <span>{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
