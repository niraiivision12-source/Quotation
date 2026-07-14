import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Download, ChevronDown, ChevronUp, Eye } from "lucide-react";

import { api } from "../../../lib/axios";
import { Button } from "../../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { useProjectQuotations, useUpdateQuotationStatus, useQuotation } from "../../quotation/quotation.query";
import { useUsers } from "../../user/user.query";
import { downloadQuotationPDF } from "../../quotation/quotation.pdf";
import QuotationPreviewDialog from "../../quotation/components/QuotationPreviewDialog";
import PaymentCollectionPopup from "../../payment/components/PaymentCollectionPopup";
import { Badge } from "../../../components/ui/badge";

interface Props {
  projectId: string;
}

const PHASES = ["PIPES", "WIRING", "SWITCHES", "LIGHTS", "FANS", "OTHERS"];

const PHASE_LABELS: Record<string, string> = {
  PIPES: "Pipes",
  WIRING: "Wiring",
  SWITCHES: "Switches",
  LIGHTS: "Lights",
  FANS: "Fans",
  OTHERS: "Others",
};

const STATUS_BADGE_STYLE: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SENT: "bg-blue-100 text-blue-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  EXPIRED: "bg-amber-100 text-amber-700",
};

export default function ProjectQuotations({ projectId }: Props) {
  const navigate = useNavigate();
  const { data: quotations = [], isLoading } = useProjectQuotations(projectId);
  const updateStatusMutation = useUpdateQuotationStatus();
  const { data: usersData } = useUsers(1);

  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({
    PIPES: true,
  });
  const [selectedPreviewQuoteId, setSelectedPreviewQuoteId] = useState<string | null>(null);
  const [linkBillQuote, setLinkBillQuote] = useState<any | null>(null);

  // Fetch full details of the quotation currently selected for preview
  const { data: fullSelectedQuote } = useQuotation(
    selectedPreviewQuoteId || undefined
  );

  const users = usersData?.items ?? [];

  const handleDownloadPDF = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
            marginPercent: item.marginPercent ? Number(item.marginPercent) : undefined,
            discountPercent: item.discountPercent ? Number(item.discountPercent) : undefined,
          })),
        },
        items: q.items.map((item: any) => ({
          id: item.id,
          productId: item.productId,
          productName: item.product?.name || "",
          sku: item.product?.sku || "",
          quantity: item.quantity,
          costPrice: item.costPrice ? Number(item.costPrice) : undefined,
          marginPercent: item.marginPercent ? Number(item.marginPercent) : undefined,
          mrp: item.mrp ? Number(item.mrp) : undefined,
          discountPercent: item.discountPercent ? Number(item.discountPercent) : undefined,
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

  const handleStatusChange = async (id: string, status: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateStatusMutation.mutateAsync({ id, status });
      toast.success("Quotation status updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update quotation status");
    }
  };

  const togglePhase = (phase: string) => {
    setExpandedPhases((prev) => ({ ...prev, [phase]: !prev[phase] }));
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground animate-pulse py-6 text-center">Loading quotations...</div>;
  }

  // Group quotations by phase
  const groups: Record<string, any[]> = {
    PIPES: [],
    WIRING: [],
    SWITCHES: [],
    LIGHTS: [],
    FANS: [],
    OTHERS: [],
  };

  for (const q of quotations) {
    const p = q.phase || "OTHERS";
    if (groups[p]) {
      groups[p].push(q);
    } else {
      groups.OTHERS.push(q);
    }
  }

  // Map full quotation to DTO for preview dialog
  const mapSelectedQuote = () => {
    if (!fullSelectedQuote) return null;
    const q = fullSelectedQuote;
    const payload = {
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
      createdById: q.createdById,
      discountAmount: Number(q.discountAmount || 0),
      items: (q.items || []).map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        marginPercent: Number(item.marginPercent),
      })),
    };

    const items = (q.items || []).map((item: any) => ({
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
    }));

    return {
      payload,
      items,
      subtotal: Number(q.subtotal),
      discountAmount: Number(q.discountAmount || 0),
      totalAmount: Number(q.totalAmount),
    };
  };

  const previewData = mapSelectedQuote();

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="space-y-3">
        {PHASES.map((phase) => {
          const list = groups[phase].sort((a, b) => b.version - a.version);
          const latest = list[0];
          const isExpanded = !!expandedPhases[phase];

          const totalAmount = latest ? Number(latest.totalAmount) : 0;
          const activeVersion = latest ? `v${latest.version}` : "No Quotations";
          const totalVersions = list.length;

          return (
            <div key={phase} className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-xs">
              {/* Accordion Header */}
              <button
                onClick={() => togglePhase(phase)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center font-bold text-xs shrink-0">
                    {PHASE_LABELS[phase][0]}
                  </div>
                  <div>
                    <span className="font-bold text-sm text-gray-900">{PHASE_LABELS[phase]} Phase</span>
                    <span className="text-[10px] text-muted-foreground ml-2 bg-gray-50 border px-1.5 py-0.5 rounded font-mono">
                      {activeVersion}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {latest && (
                    <div className="text-right">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase leading-none mb-0.5">Latest Amount</p>
                      <p className="text-sm font-bold text-violet-700">₹{totalAmount.toLocaleString()}</p>
                    </div>
                  )}
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase leading-none mb-0.5">Total Versions</p>
                    <p className="text-xs font-bold text-gray-900">{totalVersions} versions</p>
                  </div>
                  {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
              </button>

              {/* Accordion Content */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-slate-50/30 p-4 space-y-3">
                  {list.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-xs text-muted-foreground">No quotations created in this phase yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {list.map((q) => (
                        <div
                          key={q.id}
                          onClick={() => setSelectedPreviewQuoteId(q.id)}
                          className="bg-white border border-gray-100 rounded-xl p-3 shadow-xs hover:border-violet-300 transition-colors flex justify-between items-center cursor-pointer group"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-gray-900">{q.quotationNumber}</span>
                              <span className="text-[9px] text-muted-foreground bg-gray-50 border px-1 py-0.2 rounded font-mono">
                                v{q.version}
                              </span>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-semibold ${STATUS_BADGE_STYLE[q.status]}`}>
                                {q.status}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              Created: {new Date(q.createdAt).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })}
                              {q.revisionReason && ` · Reason: ${q.revisionReason.replace(/_/g, " ")}`}
                            </p>
                            {q.status === "APPROVED" && (
                              <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px]" onClick={(e) => e.stopPropagation()}>
                                {q.billCreated ? (
                                  <>
                                    <span className="text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                      Tally Bill: {q.billNumber}
                                    </span>
                                    {q.payment && (
                                      <>
                                        <Badge className={`text-[9px] font-bold ${STATUS_BADGE_STYLE[q.payment.status] || 'bg-gray-150 text-gray-700'}`}>
                                          Payment: {q.payment.status.replace(/_/g, " ")}
                                        </Badge>
                                        <span className="text-muted-foreground font-semibold">
                                          Paid: ₹{Number(q.payment.amountReceived).toLocaleString()} · Pending: ₹{Number(q.payment.pendingAmount).toLocaleString()}
                                        </span>
                                      </>
                                    )}
                                  </>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 px-2 text-[9px] font-bold bg-violet-600 text-white hover:bg-violet-700 hover:text-white"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setLinkBillQuote(q);
                                    }}
                                  >
                                    Link Tally Bill
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-900 mr-2">₹{Number(q.totalAmount).toLocaleString()}</span>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 hover:bg-slate-100 text-gray-500 hover:text-violet-600"
                              title="Download PDF"
                              onClick={(e) => handleDownloadPDF(q.id, e)}
                            >
                              <Download size={13} />
                            </Button>

                            <div onClick={(e) => e.stopPropagation()}>
                              <Select
                                value={q.status}
                                onValueChange={(val) => handleStatusChange(q.id, val, {} as any)}
                                disabled={updateStatusMutation.isPending}
                              >
                                <SelectTrigger className="h-7 text-[10px] font-semibold w-24 border">
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
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-violet-600 group-hover:bg-violet-50 transition-colors"
                            >
                              <Eye size={12} className="mr-1" /> View
                            </Button>
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

      {/* Preview Dialog */}
      {selectedPreviewQuoteId && previewData && (
        <QuotationPreviewDialog
          open={!!selectedPreviewQuoteId}
          payload={previewData.payload}
          quotationType={previewData.payload.type}
          targetName={
            previewData.payload.type === "WALK_IN_CUSTOMER"
              ? previewData.payload.walkInName
              : fullSelectedQuote?.lead?.name || fullSelectedQuote?.customer?.name || ""
          }
          projectName={fullSelectedQuote?.project?.projectName}
          items={previewData.items}
          users={users}
          subtotal={previewData.subtotal}
          discountAmount={previewData.discountAmount}
          totalAmount={previewData.totalAmount}
          isCreating={false}
          onOpenChange={(open) => !open && setSelectedPreviewQuoteId(null)}
          onConfirm={() => setSelectedPreviewQuoteId(null)}
          onEdit={() => {
            navigate(`/quotations?editId=${selectedPreviewQuoteId}`);
            setSelectedPreviewQuoteId(null);
          }}
        />
      )}

      {/* Link Tally Bill Popup */}
      <PaymentCollectionPopup
        open={!!linkBillQuote}
        onOpenChange={(open) => !open && setLinkBillQuote(null)}
        quotation={linkBillQuote}
      />
    </div>
  );
}
