import { ArrowLeft, FileText, GitBranch, Eye, Download, Edit } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import { api } from "../../lib/axios";
import QuotationPreviewDialog from "./components/QuotationPreviewDialog";
import { downloadQuotationPDF } from "./quotation.pdf";
import { useQuotation, useQuotationHistory } from "./quotation.query";

const STATUS_BADGE_STYLE: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SENT: "bg-blue-100 text-blue-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  EXPIRED: "bg-amber-100 text-amber-700",
};

const formatMoney = (value: number | string | null | undefined) =>
  `₹${Number(value ?? 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default function QuotationHistory() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: quotation } = useQuotation(id);
  const { data: versions = [], isLoading } = useQuotationHistory(id);

  const [selectedPreviewQuote, setSelectedPreviewQuote] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Newest first, so the current version reads at the top.
  const ordered = [...versions].sort((a, b) => b.version - a.version);
  const latestVersion = ordered[0]?.version;

  const target =
    quotation?.customer?.name ??
    quotation?.lead?.name ??
    quotation?.walkInName ??
    "—";

  const handlePreview = async (versionId: string) => {
    const loadingToast = toast.loading("Loading preview...");
    try {
      const response = await api.get(`/quotations/${versionId}`);
      setSelectedPreviewQuote(response.data.data);
      setIsPreviewOpen(true);
      toast.dismiss(loadingToast);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load quotation details", { id: loadingToast });
    }
  };

  const handleDownload = async (versionId: string) => {
    const loadingToast = toast.loading("Generating PDF...");
    try {
      const response = await api.get(`/quotations/${versionId}`);
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

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => navigate("/quotations")}
        >
          <ArrowLeft size={16} />
        </Button>

        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <GitBranch size={16} className="text-violet-600" />
            Quotation History
          </h1>
          <p className="text-xs text-muted-foreground">
            {quotation ? `${quotation.quotationNumber} · ${target}` : " "}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
      ) : versions.length === 0 ? (
        <div className="bg-white border border-gray-150 rounded-2xl text-center py-16 shadow-xs">
          <FileText size={24} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm font-semibold text-gray-900">No history found</p>
          <p className="text-xs text-muted-foreground mt-1">
            This quotation has no revision chain.
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {versions.length} version{versions.length === 1 ? "" : "s"} in this
            revision chain, newest first.
          </p>

          <div className="space-y-3">
            {ordered.map((version, index) => {
              const isLatest = version.version === latestVersion;
              const isViewed = version.id === id;
              // Versions are newest-first, so the next entry is the older one.
              const previous = ordered[index + 1];
              const delta = previous
                ? Number(version.totalAmount) - Number(previous.totalAmount)
                : 0;

              return (
                <div
                  key={version.id}
                  className={`border rounded-2xl p-4 shadow-xs ${
                    isViewed
                      ? "border-violet-300 bg-violet-50/40"
                      : "border-gray-150 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-gray-900">
                          {version.quotationNumber}
                        </span>
                        <span className="text-[10px] text-muted-foreground bg-gray-50 border px-1.5 py-0.5 rounded font-mono">
                          v{version.version}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            STATUS_BADGE_STYLE[version.status] ??
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {version.status}
                        </span>
                        {isLatest && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-violet-100 text-violet-700">
                            LATEST
                          </span>
                        )}
                        {!version.parentQuotationId && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-600">
                            ORIGINAL
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-muted-foreground">
                        {formatDate(version.createdAt)}
                        {version.createdBy && ` · ${version.createdBy.name}`}
                        {version._count && ` · ${version._count.items} items`}
                        {version.phase && ` · ${version.phase}`}
                      </p>

                      {version.revisionReason && (
                        <p className="text-[11px] text-amber-700">
                          Revised: {version.revisionReason.replace(/_/g, " ")}
                        </p>
                      )}

                      {version.notes && (
                        <p className="text-[11px] text-muted-foreground max-w-lg">
                          {version.notes}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-900">
                        {formatMoney(version.totalAmount)}
                      </p>
                      {previous && delta !== 0 && (
                        <p
                          className={`text-[11px] font-semibold ${
                            delta > 0 ? "text-rose-600" : "text-emerald-600"
                          }`}
                        >
                          {delta > 0 ? "+" : "−"}
                          {formatMoney(Math.abs(delta))} vs v{previous.version}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Version Action Buttons */}
                  <div className="mt-3 pt-3 border-t flex flex-wrap gap-2 justify-end">
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      onClick={() => navigate(`/quotations?editId=${version.id}`)}
                    >
                      <Edit size={12} className="mr-1" />
                      Edit/Revise
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {selectedPreviewQuote && (
        <QuotationPreviewDialog
          open={isPreviewOpen}
          payload={{
            type: selectedPreviewQuote.type,
            leadId: selectedPreviewQuote.leadId,
            customerId: selectedPreviewQuote.customerId,
            projectId: selectedPreviewQuote.projectId,
            phase: selectedPreviewQuote.phase,
            walkInName: selectedPreviewQuote.walkInName,
            walkInMobile: selectedPreviewQuote.walkInMobile,
            walkInEmail: selectedPreviewQuote.walkInEmail,
            walkInAddress: selectedPreviewQuote.walkInAddress,
            notes: selectedPreviewQuote.notes,
            validUntil: selectedPreviewQuote.validUntil,
            createdById: selectedPreviewQuote.createdById,
            discountAmount: Number(selectedPreviewQuote.discountAmount || 0),
            items: selectedPreviewQuote.items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              marginPercent: item.marginPercent ? Number(item.marginPercent) : undefined,
              discountPercent: item.discountPercent ? Number(item.discountPercent) : undefined,
            })),
          }}
          quotationType={selectedPreviewQuote.type}
          targetName={
            selectedPreviewQuote.lead?.name ||
            selectedPreviewQuote.customer?.name ||
            selectedPreviewQuote.walkInName
          }
          projectName={selectedPreviewQuote.project?.projectName}
          items={selectedPreviewQuote.items.map((item: any) => ({
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
          }))}
          users={selectedPreviewQuote.createdBy ? [selectedPreviewQuote.createdBy] : []}
          subtotal={Number(selectedPreviewQuote.subtotal)}
          discountAmount={Number(selectedPreviewQuote.discountAmount || 0)}
          totalAmount={Number(selectedPreviewQuote.totalAmount)}
          isCreating={false}
          onOpenChange={setIsPreviewOpen}
          readOnly={true}
        />
      )}
    </div>
  );
}
