import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import type { Lead } from "./lead.types";

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-yellow-100 text-yellow-700",
  FOLLOW_UP: "bg-orange-100 text-orange-700",
  QUOTATION_SENT: "bg-purple-100 text-purple-700",
  NEGOTIATION: "bg-pink-100 text-pink-700",
  WON: "bg-green-100 text-green-700",
  LOST: "bg-red-100 text-red-700",
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  );
}

interface Props {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
}

export default function LeadDetailDrawer({ lead, open, onClose }: Props) {
  if (!lead) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="text-lg">{lead.name}</SheetTitle>
          <span
            className={`inline-flex w-fit px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[lead.status]}`}
          >
            {lead.status.replace(/_/g, " ")}
          </span>
        </SheetHeader>

        <div className="p-4 space-y-5">
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Contact Info
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <InfoRow label="Mobile" value={lead.mobile} />
              <InfoRow label="Email" value={lead.email} />
              <InfoRow label="City" value={lead.city} />
              <InfoRow label="Source" value={lead.source} />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Assignment
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <InfoRow label="Contact Owner" value={lead.contactOwner?.name} />
              <InfoRow
                label="Referral Date"
                value={
                  lead.referralDate
                    ? new Date(lead.referralDate).toLocaleDateString()
                    : undefined
                }
              />
              <InfoRow
                label="Created At"
                value={new Date(lead.createdAt).toLocaleDateString()}
              />
            </div>
          </section>

          {lead.notes && (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Notes
              </h3>
              <p className="text-sm whitespace-pre-wrap rounded-md bg-muted p-3">
                {lead.notes}
              </p>
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
