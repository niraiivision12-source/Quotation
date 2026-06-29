import { useState } from "react";
import { toast } from "sonner";
import { FileText, Download, RotateCcw, ChevronDown, ChevronUp, Layers } from "lucide-react";

import { api } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateRevision, useUpdateQuotationStatus, useProjectQuotations } from "../../quotation/quotation.query";
import { downloadQuotationPDF } from "../../quotation/quotation.pdf";

interface Props {
  projectId: string;
}

export default function ProjectQuotations({ projectId }: Props) {
  const { data: quotations = [], isLoading } = useProjectQuotations(projectId);
  const createRevisionMutation = useCreateRevision();
  const updateStatusMutation = useUpdateQuotationStatus();

  const [revisionOpen, setRevisionOpen] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [revisionReason, setRevisionReason] = useState<string>("PRICE_CHANGE");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const handleDownloadPDF = async (id: string) => {
    const loadingToast = toast.loading("Generating PDF...");
    try {
      const response = await api.get(`/quotations/${id}`);
      const q = response.data.data;

      downloadQuotationPDF({
        quotationNumber: q.quotationNumber,
        quotationType: q.type,
        targetName: q.lead?.name || q.customer?.name || q.walkInName || "",
        projectName: q.project?.projectName || "",
        payload: {
          type: q.type,
          leadId: q.leadId,
          customerId: q.customerId,
          projectId: q.projectId,
          phase: q.phase,
          walkInName: q.walkInName,
          walkInMobile: q.walkInMobile,
          walkInEmail: q.walkInEmail,
          walkInAddress: q.walkInAddress,
          notes: q.notes,
          validUntil: q.validUntil,
          items: q.items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            marginPercent: Number(item.marginPercent),
          })),
        },
        items: q.items.map((item: any) => ({
          id: item.id,
          productId: item.productId,
          productName: item.product?.name || "",
          sku: item.product?.sku || "",
          quantity: item.quantity,
          costPrice: Number(item.costPrice),
          marginPercent: Number(item.marginPercent),
          sellingPrice: Number(item.sellingPrice),
          totalPrice: Number(item.totalPrice),
          search: item.product?.name || "",
          showDropdown: false,
        })),
        subtotal: Number(q.subtotal),
        discountAmount: Number(q.discountAmount || 0),
        totalAmount: Number(q.totalAmount),
        companyDetails: q.companyNameSnapshot ? {
          companyName: q.companyNameSnapshot,
          companyLogo: q.companyLogoSnapshot,
          companyGst: q.companyGstSnapshot,
          companyAddress: q.companyAddressSnapshot,
          companyPhone: q.companyPhoneSnapshot,
          companyEmail: q.companyEmailSnapshot,
          companyWebsite: q.companyWebsiteSnapshot,
          bankName: q.bankNameSnapshot,
          bankAccountNo: q.bankAccountNoSnapshot,
          bankIfsc: q.bankIfscSnapshot,
          bankBranch: q.bankBranchSnapshot,
          upiId: q.upiIdSnapshot,
          termsAndConditions: q.termsAndConditionsSnapshot,
          authorizedSignature: q.authorizedSignatureSnapshot,
          footerText: q.footerTextSnapshot,
        } : undefined,
      });
      toast.success("PDF Downloaded successfully", { id: loadingToast });
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF", { id: loadingToast });
    }
  };

  const handleCreateRevisionClick = (id: string) => {
    setSelectedQuoteId(id);
    setRevisionOpen(true);
  };

  const handleConfirmRevision = async () => {
    if (!selectedQuoteId) return;
    try {
      await createRevisionMutation.mutateAsync({
        id: selectedQuoteId,
        reason: revisionReason,
      });
      toast.success("Quotation revision created as draft");
      setRevisionOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to create revision");
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status });
      toast.success("Quotation status updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update quotation status");
    }
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground animate-pulse py-6 text-center">Loading quotations...</div>;
  }

  // Trace rootId for each quotation to group revision history
  const getRootId = (q: any): string => {
    let curr = q;
    while (curr.parentQuotationId) {
      const parent = quotations.find((x: any) => x.id === curr.parentQuotationId);
      if (!parent) break;
      curr = parent;
    }
    return curr.id;
  };

  // Group quotations by rootId
  const groups: Record<string, any[]> = {};
  for (const q of quotations) {
    const rId = getRootId(q);
    if (!groups[rId]) groups[rId] = [];
    groups[rId].push(q);
  }

  const groupKeys = Object.keys(groups);

  const STATUS_BADGE_STYLE: Record<string, string> = {
    DRAFT: "bg-gray-155 text-gray-700",
    SENT: "bg-blue-100 text-blue-700",
    APPROVED: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-red-100 text-red-700",
    EXPIRED: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {groupKeys.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-100 rounded-2xl p-6">
          <FileText size={36} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-semibold text-gray-900">No Quotations Yet</p>
          <p className="text-xs text-muted-foreground mt-1">Manual projects start with no quotations. Create one from the Quotations page.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupKeys.map((rootId) => {
            const list = groups[rootId].sort((a, b) => b.version - a.version);
            const latest = list[0];
            const history = list.slice(1);
            const isExpanded = !!expandedGroups[rootId];

            // A quotation is revisable if it is not DRAFT and not APPROVED
            const isRevisable = latest.status !== "DRAFT" && latest.status !== "APPROVED";

            return (
              <div key={rootId} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-gray-900">{latest.quotationNumber}</span>
                      <span className="text-xs text-muted-foreground bg-gray-50 border px-1.5 py-0.5 rounded font-mono">v{latest.version}</span>
                      {latest.phase && (
                        <span className="text-xs bg-violet-50 text-violet-700 border border-violet-100 px-2 py-0.5 rounded-full font-medium">
                          {latest.phase.charAt(0) + latest.phase.slice(1).toLowerCase()} Phase
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(latest.createdAt).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status update selector */}
                    <Select value={latest.status} onValueChange={(val) => handleStatusChange(latest.id, val)} disabled={updateStatusMutation.isPending}>
                      <SelectTrigger className="h-8 text-xs font-semibold w-32 border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="SENT">Sent</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                        <SelectItem value="EXPIRED">Expired</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button variant="outline" size="sm" className="h-8 px-2.5 border" onClick={() => handleDownloadPDF(latest.id)}>
                      <Download size={13} className="mr-1" /> PDF
                    </Button>

                    {isRevisable && (
                      <Button size="sm" className="h-8 px-2.5 bg-violet-600 hover:bg-violet-700 text-white font-medium" onClick={() => handleCreateRevisionClick(latest.id)}>
                        <RotateCcw size={13} className="mr-1" /> Revise
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center bg-slate-50 rounded-xl p-3">
                  <span className="text-xs font-medium text-muted-foreground">Quotation Total Value</span>
                  <span className="text-base font-bold text-violet-700">₹{Number(latest.totalAmount).toLocaleString()}</span>
                </div>

                {latest.notes && (
                  <p className="text-xs text-muted-foreground border-t pt-3">
                    <span className="font-semibold text-gray-900">Notes:</span> {latest.notes}
                  </p>
                )}

                {/* Revision History list */}
                {history.length > 0 && (
                  <div className="border-t pt-3">
                    <button
                      onClick={() => toggleGroup(rootId)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-700 cursor-pointer"
                    >
                      <Layers size={13} />
                      {isExpanded ? "Hide Revision History" : `View Revision History (${history.length})`}
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>

                    {isExpanded && (
                      <div className="mt-3 space-y-2 pl-3 border-l border-slate-100">
                        {history.map((h) => (
                          <div key={h.id} className="flex justify-between items-center text-xs py-1.5 hover:bg-slate-50/50 rounded px-2 transition-colors">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-muted-foreground">v{h.version}</span>
                              <span className="text-gray-900">{h.quotationNumber}</span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${STATUS_BADGE_STYLE[h.status]}`}>
                                {h.status}
                              </span>
                              {h.revisionReason && (
                                <span className="text-[10px] bg-amber-50 text-amber-700 border px-1.5 py-0.2 rounded">
                                  Reason: {h.revisionReason.replace(/_/g, " ")}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-gray-900">₹{Number(h.totalAmount).toLocaleString()}</span>
                              <button onClick={() => handleDownloadPDF(h.id)} className="text-violet-600 hover:underline flex items-center gap-0.5 cursor-pointer">
                                <Download size={11} /> PDF
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Revision Dialog */}
      {revisionOpen && (
        <Dialog open={revisionOpen} onOpenChange={(o) => !o && setRevisionOpen(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Quotation Revision</DialogTitle>
              <DialogDescription>
                Select the reason for creating this revision. A new draft copy will be created.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-2">
              <label className="text-xs font-semibold text-gray-900 uppercase">Revision Reason</label>
              <Select value={revisionReason} onValueChange={setRevisionReason}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRICE_CHANGE">Price Change</SelectItem>
                  <SelectItem value="PRODUCT_CHANGE">Product Change</SelectItem>
                  <SelectItem value="CUSTOMER_REQUEST">Customer Request</SelectItem>
                  <SelectItem value="STOCK_CHANGE">Stock Change</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setRevisionOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmRevision} disabled={createRevisionMutation.isPending} className="bg-violet-600 hover:bg-violet-700 text-white font-medium">
                {createRevisionMutation.isPending ? "Creating..." : "Confirm & Revise"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
