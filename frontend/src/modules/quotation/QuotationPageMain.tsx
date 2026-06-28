import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { RotateCcw, SearchCheck } from "lucide-react";

import PageHeader from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";

import QuotationInfoCard from "./components/QuotationInfoCard";
import QuotationItemsTable from "./components/QuotationItemsTable";
import QuotationPreviewDialog from "./components/QuotationPreviewDialog";
import { useCreateQuotation } from "./quotation.query";
import { downloadQuotationPDF } from "./quotation.pdf";
import { createEmptyQuotationRow } from "./quotation.utils";
import type { CreateQuotationDTO, ProjectPhase, QuotationItemForm } from "./quotation.types";

interface User { id: string; name: string; role: string; }

export default function QuotationPageMain() {
  const createMutation = useCreateQuotation();
  const currentUser = useAuthStore((state) => state.user);
  const [searchParams, setSearchParams] = useSearchParams();

  const [quotationType, setQuotationType] = useState<
    "LEAD" | "CUSTOMER" | "WALK_IN_CUSTOMER"
  >("LEAD");
  const [leadId, setLeadId] = useState(() => searchParams.get("leadId") ?? "");
  const [customerId, setCustomerId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [phase, setPhase] = useState<ProjectPhase | undefined>();
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [walkInName, setWalkInName] = useState("");
  const [walkInMobile, setWalkInMobile] = useState("");
  const [walkInEmail, setWalkInEmail] = useState("");
  const [walkInAddress, setWalkInAddress] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountInput, setDiscountInput] = useState("0");
  const isDiscountFocusedRef = useRef(false);
  const [items, setItems] = useState<QuotationItemForm[]>([createEmptyQuotationRow()]);
  const [users, setUsers] = useState<User[]>([]);
  const [billingUserId, setBillingUserId] = useState("");
  const [previewPayload, setPreviewPayload] = useState<CreateQuotationDTO | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewDetails, setPreviewDetails] = useState<{ targetName?: string; projectName?: string }>({});

  useEffect(() => {
    if (searchParams.get("leadId")) setSearchParams({}, { replace: true });
  }, []);

  useEffect(() => {
    async function loadUsers() {
      try {
        const response = await api.get("/users");
        const items = response.data.data.items ?? [];
        setUsers(items);
        if (currentUser?.id) setBillingUserId(currentUser.id);
      } catch (error) { console.error(error); }
    }
    loadUsers();
  }, [currentUser]);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.totalPrice, 0), [items]);
  const totalAmount = Math.max(subtotal - discountAmount, 0);

  useEffect(() => {
    if (isDiscountFocusedRef.current) return;
    setDiscountInput(String(discountAmount));
  }, [discountAmount]);

  const handlePreviewDetailsChange = useCallback(
    (details: { targetName?: string; projectName?: string }) => {
      setPreviewDetails((prev) => ({ ...prev, ...details }));
    },
    [],
  );

  function handleAddRow() { setItems((prev) => [...prev, createEmptyQuotationRow()]); }
  function handleRemoveRow(id: string) { setItems((prev) => prev.filter((item) => item.id !== id)); }
  function handleUpdateRow(id: string, updates: Partial<QuotationItemForm>) {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, ...updates } : item));
  }

  function handleReset() {
    setQuotationType("LEAD");
    setLeadId(""); setCustomerId(""); setProjectId("");
    setPhase(undefined); setValidUntil(""); setNotes("");
    setDiscountAmount(0); setDiscountInput("0");
    setBillingUserId(currentUser?.id ?? "");
    setItems([createEmptyQuotationRow()]);
    setPreviewPayload(null);
    setIsPreviewOpen(false);
    setPreviewDetails({});
    setWalkInName("");
    setWalkInMobile("");
    setWalkInEmail("");
    setWalkInAddress("");
  }

  function handleQuotationTypeChange(
    value: "LEAD" | "CUSTOMER" | "WALK_IN_CUSTOMER",
  ) {
    setQuotationType(value);
    setLeadId(""); setCustomerId(""); setProjectId("");
    setPreviewDetails({});
    setWalkInName("");
    setWalkInMobile("");
    setWalkInEmail("");
    setWalkInAddress("");
  }

  function handleDiscountChange(value: string) {
    setDiscountInput(value);
    setDiscountAmount(value === "" ? 0 : Number(value));
  }

  function handleDiscountBlur() {
    isDiscountFocusedRef.current = false;
    if (discountInput === "") setDiscountInput("0");
  }

  function buildQuotationPayload() {
    if (quotationType !== "WALK_IN_CUSTOMER" && !phase) {
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
    if (quotationType === "WALK_IN_CUSTOMER") {
      if (!walkInName.trim()) {
        toast.error("Customer name is required");
        return null;
      }
      if (!walkInMobile.trim()) {
        toast.error("Mobile number is required");
        return null;
      }
    }
    const validItems = items.filter((item) => item.productId);
    if (validItems.length === 0) { toast.error("Add at least one product"); return null; }
    return {
      type: quotationType,
      leadId: quotationType === "LEAD" ? leadId : undefined,
      customerId: quotationType === "CUSTOMER" ? customerId : undefined,
      projectId: quotationType === "CUSTOMER" ? projectId : undefined,
      phase: quotationType !== "WALK_IN_CUSTOMER" ? phase : undefined,
      walkInName: quotationType === "WALK_IN_CUSTOMER" ? walkInName : undefined,
      walkInMobile: quotationType === "WALK_IN_CUSTOMER" ? walkInMobile : undefined,
      walkInEmail: (quotationType === "WALK_IN_CUSTOMER" && walkInEmail) ? walkInEmail : undefined,
      walkInAddress: (quotationType === "WALK_IN_CUSTOMER" && walkInAddress) ? walkInAddress : undefined,
      notes,
      validUntil: validUntil || undefined,
      createdById: billingUserId,
      discountAmount,
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
        companyDetails: quotation?.companyNameSnapshot ? {
          companyName: quotation.companyNameSnapshot,
          companyLogo: quotation.companyLogoSnapshot,
          companyGst: quotation.companyGstSnapshot,
          companyAddress: quotation.companyAddressSnapshot,
          companyPhone: quotation.companyPhoneSnapshot,
          companyEmail: quotation.companyEmailSnapshot,
          companyWebsite: quotation.companyWebsiteSnapshot,
          bankName: quotation.bankNameSnapshot,
          bankAccountNo: quotation.bankAccountNoSnapshot,
          bankIfsc: quotation.bankIfscSnapshot,
          bankBranch: quotation.bankBranchSnapshot,
          upiId: quotation.upiIdSnapshot,
          termsAndConditions: quotation.termsAndConditionsSnapshot,
          authorizedSignature: quotation.authorizedSignatureSnapshot,
          footerText: quotation.footerTextSnapshot,
        } : undefined,
      });
      toast.success("Quotation created");
      handleReset();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create quotation");
    }
  }

  return (
    <div>
      <PageHeader title="Quotation" />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Left — info card */}
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
            walkInName={walkInName}
            walkInMobile={walkInMobile}
            walkInEmail={walkInEmail}
            walkInAddress={walkInAddress}
            onLeadChange={setLeadId}
            onCustomerChange={setCustomerId}
            onProjectChange={setProjectId}
            onPhaseChange={(value) => setPhase(value as ProjectPhase)}
            onValidUntilChange={setValidUntil}
            onNotesChange={setNotes}
            onWalkInNameChange={setWalkInName}
            onWalkInMobileChange={setWalkInMobile}
            onWalkInEmailChange={setWalkInEmail}
            onWalkInAddressChange={setWalkInAddress}
            onPreviewDetailsChange={handlePreviewDetailsChange}
          />
        </div>

        {/* Right — summary card */}
        <div className="min-w-0 rounded-xl border bg-white p-5">
          <h2 className="text-base font-semibold mb-0.5">Summary</h2>
          <p className="text-sm text-muted-foreground mb-5">Owner, totals &amp; action</p>

          <div className="space-y-4">
            {/* Owner */}
            <div>
              <label className="text-sm font-medium">Quotation Owner</label>
              <Select value={billingUserId} onValueChange={setBillingUserId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select owner" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} <span className="text-muted-foreground text-xs">({u.role})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Totals */}
            <div className="rounded-xl border bg-slate-50 p-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">₹ {subtotal.toFixed(2)}</span>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Discount (₹)</label>
                <Input
                  type="number"
                  min={0}
                  className="mt-1 bg-white"
                  value={discountInput}
                  onFocus={() => { isDiscountFocusedRef.current = true; }}
                  onBlur={handleDiscountBlur}
                  onChange={(e) => handleDiscountChange(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between border-t pt-3">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold text-violet-700">₹ {totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="outline" onClick={handleReset}>
                <RotateCcw size={15} className="mr-1" /> Reset
              </Button>
              <Button type="button" disabled={createMutation.isPending} onClick={handlePreview}>
                <SearchCheck size={15} className="mr-1" /> Preview
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom — items table (full width) */}
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
