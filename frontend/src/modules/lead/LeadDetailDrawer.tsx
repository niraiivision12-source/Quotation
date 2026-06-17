import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Wrench, Zap, ToggleLeft, Lightbulb, Wind, Check } from "lucide-react";
import type { Lead, LeadLifecycle, PhaseStatus, ProjectPhase } from "./lead.types";
import { useLeadLifecycle } from "./lead.query";

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-yellow-100 text-yellow-700",
  FOLLOW_UP: "bg-orange-100 text-orange-700",
  QUOTATION_SENT: "bg-purple-100 text-purple-700",
  NEGOTIATION: "bg-pink-100 text-pink-700",
  WON: "bg-green-100 text-green-700",
  LOST: "bg-red-100 text-red-700",
};

const PHASE_META: Record<ProjectPhase, { label: string; icon: React.ReactNode }> = {
  PIPES:    { label: "Pipes",    icon: <Wrench size={16} /> },
  WIRING:   { label: "Wiring",  icon: <Zap size={16} /> },
  SWITCHES: { label: "Switches",icon: <ToggleLeft size={16} /> },
  LIGHTS:   { label: "Lights",  icon: <Lightbulb size={16} /> },
  FANS:     { label: "Fans",    icon: <Wind size={16} /> },
};

const PHASE_ORDER: ProjectPhase[] = ["PIPES", "WIRING", "SWITCHES", "LIGHTS", "FANS"];

const PHASE_STYLE: Record<PhaseStatus, { circle: string; label: string; line: string }> = {
  COMPLETED:   { circle: "bg-violet-600 text-white", label: "text-violet-600", line: "bg-violet-500" },
  IN_PROGRESS: { circle: "bg-violet-600 text-white ring-4 ring-violet-100", label: "text-violet-700", line: "bg-gray-200" },
  SKIPPED:     { circle: "bg-gray-200 text-gray-400", label: "text-gray-400", line: "bg-gray-200" },
  NOT_STARTED: { circle: "bg-gray-100 text-gray-400", label: "text-gray-400", line: "bg-gray-200" },
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  );
}

function LifecycleTracker({ lifecycle }: { lifecycle: LeadLifecycle }) {
  const phases = PHASE_ORDER.map((phase) =>
    lifecycle.phaseTracking.find((p) => p.phase === phase) ?? {
      id: phase,
      phase,
      status: "NOT_STARTED" as PhaseStatus,
    }
  );

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Construction Lifecycle · {lifecycle.projectName}
      </h3>

      <div className="flex items-start">
        {phases.map((p, index) => {
          const meta = PHASE_META[p.phase];
          const style = PHASE_STYLE[p.status];
          const isLast = index === phases.length - 1;
          const prevDone =
            index === 0 ||
            phases[index - 1].status === "COMPLETED" ||
            phases[index - 1].status === "SKIPPED";

          return (
            <div key={p.phase} className="flex flex-col items-center flex-1">
              <div className="flex items-center w-full">
                <div
                  className={`flex-1 h-0.5 ${index === 0 ? "invisible" : prevDone ? "bg-violet-500" : "bg-gray-200"}`}
                />
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${style.circle}`}>
                  {p.status === "COMPLETED" ? <Check size={15} /> : meta.icon}
                </div>
                <div className={`flex-1 h-0.5 ${isLast ? "invisible" : style.line}`} />
              </div>
              <span className={`mt-1.5 text-xs text-center font-medium leading-tight ${style.label}`}>
                {meta.label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

interface Props {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
}

export default function LeadDetailDrawer({ lead, open, onClose }: Props) {
  const { data: lifecycle, isLoading: lifecycleLoading } = useLeadLifecycle(
    lead?.status === "WON" ? lead.id : null
  );

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
          {/* Lifecycle — only shown for WON leads that have a project */}
          {lead.status === "WON" && (
            lifecycleLoading ? (
              <div className="text-xs text-muted-foreground">Loading lifecycle...</div>
            ) : lifecycle ? (
              <>
                <LifecycleTracker lifecycle={lifecycle} />
                <div className="border-t" />
              </>
            ) : null
          )}

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
                value={lead.referralDate ? new Date(lead.referralDate).toLocaleDateString() : undefined}
              />
              <InfoRow
                label="Created At"
                value={new Date(lead.createdAt).toLocaleDateString()}
              />
              {lead.nextFollowUpAt && (
                <div className="flex flex-col gap-0.5 col-span-2">
                  <span className="text-xs text-muted-foreground">Follow-Up</span>
                  <span className={`text-sm font-medium flex items-center gap-2 ${new Date(lead.nextFollowUpAt) < new Date() ? "text-red-500" : "text-orange-500"}`}>
                    {new Date(lead.nextFollowUpAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                    {new Date(lead.nextFollowUpAt) < new Date() && (
                      <span className="text-xs bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full">Overdue</span>
                    )}
                  </span>
                </div>
              )}
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
