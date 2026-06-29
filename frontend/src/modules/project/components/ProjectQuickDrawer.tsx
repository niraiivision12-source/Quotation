import {
  ArrowUpRight,
  Bell,
  Clock,
  MapPin,
  Phone,
  FileText,
  Download,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/lib/axios";
import { downloadQuotationPDF } from "../../quotation/quotation.pdf";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { useProject } from "../project.query";

const PHASE_BADGE: Record<string, string> = {
  PIPES: "bg-orange-100 text-orange-700",
  WIRING: "bg-yellow-100 text-yellow-700",
  SWITCHES: "bg-blue-100 text-blue-700",
  LIGHTS: "bg-violet-100 text-violet-700",
  FANS: "bg-teal-100 text-teal-700",
  OTHERS: "bg-gray-100 text-gray-700",
};

const QUOTATION_STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  SENT: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  EXPIRED: "bg-orange-100 text-orange-600",
};

const PRIORITY_COLOR: Record<string, string> = {
  HIGH: "text-red-600",
  MEDIUM: "text-yellow-600",
  LOW: "text-green-600",
};

interface Props {
  projectId: string | null;
  onClose: () => void;
}

export default function ProjectQuickDrawer({ projectId, onClose }: Props) {
  const { data, isLoading } = useProject(projectId ?? "");

  const latestQuotation = data?.quotations?.[0] ?? null;
  const nextReminder = data?.reminders?.[0] ?? null;
  const activities = data?.activities ?? [];

  const handleDownloadPDF = async (id: string) => {
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
    } catch (err) {
      console.error(err);
      toast.error("Failed to download quotation PDF");
    }
  };

  return (
    <Sheet open={!!projectId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-[420px] sm:max-w-[420px] p-0 flex flex-col overflow-hidden">
        {isLoading || !data ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            Loading...
          </div>
        ) : (
          <>
            {/* Header */}
            <SheetHeader className="px-5 pt-5 pb-4 border-b">
              <div className="flex items-start justify-between pr-8">
                <div>
                  <SheetTitle className="text-base">{data.projectName}</SheetTitle>
                  {data.location && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin size={11} /> {data.location}
                    </p>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${PHASE_BADGE[data.currentPhase] ?? "bg-gray-100 text-gray-600"}`}>
                  {data.currentPhase.charAt(0) + data.currentPhase.slice(1).toLowerCase()}
                </span>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

              {/* Customer */}
              <section className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer</p>
                <div className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium">{data.customer.name}</p>
                    <p className="text-xs text-muted-foreground">{data.customer.mobile}</p>
                  </div>
                  <a href={`tel:${data.customer.mobile}`}>
                    <Button size="sm" variant="outline" className="h-8 gap-1.5">
                      <Phone size={13} /> Call
                    </Button>
                  </a>
                </div>
              </section>

              {/* Lifecycle progress */}
              <section className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Lifecycle</p>
                <div className="flex gap-1">
                  {data.phaseTracking.map((phase: any) => (
                    <div key={phase.id} className="flex-1 flex flex-col items-center gap-1">
                      <div className={`h-1.5 w-full rounded-full ${
                        phase.status === "COMPLETED" ? "bg-green-500" :
                        phase.status === "IN_PROGRESS" ? "bg-blue-500" :
                        phase.status === "SKIPPED" ? "bg-gray-300" :
                        "bg-gray-100"
                      }`} />
                      <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                        {phase.phase.charAt(0) + phase.phase.slice(1).toLowerCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Latest Quotation */}
              <section className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Latest Quotation</p>
                {latestQuotation ? (
                  <div className="bg-muted/40 rounded-lg px-3 py-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">₹{Number(latestQuotation.totalAmount).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{latestQuotation.quotationNumber}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${QUOTATION_STATUS_BADGE[latestQuotation.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {latestQuotation.status.charAt(0) + latestQuotation.status.slice(1).toLowerCase()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDownloadPDF(latestQuotation.id)}
                        className="p-1.5 hover:bg-zinc-200 rounded text-zinc-500 hover:text-zinc-800 transition"
                        title="Download PDF"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No quotations yet</p>
                )}
              </section>

              {/* Next Reminder */}
              <section className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Next Follow-up</p>
                {nextReminder ? (
                  <div className="bg-muted/40 rounded-lg px-3 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell size={14} className="text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{nextReminder.title}</p>
                        <p className={`text-xs font-medium ${PRIORITY_COLOR[nextReminder.priority] ?? "text-muted-foreground"}`}>
                          {nextReminder.priority.charAt(0) + nextReminder.priority.slice(1).toLowerCase()} priority
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                      <Clock size={11} />
                      {new Date(nextReminder.dueAt).toLocaleDateString()}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No upcoming reminders</p>
                )}
              </section>

              {/* Recent Activity */}
              <section className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recent Activity</p>
                {activities.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No activity yet</p>
                ) : (
                  <div className="space-y-2">
                    {activities.map((activity: any) => (
                      <div key={activity.id} className="flex gap-2 items-start">
                        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 mt-1.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-foreground leading-snug">{activity.message}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(activity.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Footer actions */}
            <div className="border-t px-5 py-4 flex gap-2">
              <Link to={`/projects/${data.id}`} className="flex-1">
                <Button variant="outline" className="w-full gap-1.5" size="sm">
                  <ArrowUpRight size={14} /> Full Details
                </Button>
              </Link>
              <Link to={`/projects/${data.id}`} className="flex-1">
                <Button className="w-full gap-1.5" size="sm">
                  <FileText size={14} /> New Quotation
                </Button>
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
