import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Calendar, Check, MapPin, Phone } from "lucide-react";
import { useLead } from "./lead.query";
import type { Lead, LeadActivity, LeadActivityType } from "./lead.types";

// ─── Status badge ──────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-yellow-100 text-yellow-700",
  FOLLOW_UP: "bg-orange-100 text-orange-700",
  QUOTATION_SENT: "bg-purple-100 text-purple-700",
  NEGOTIATION: "bg-pink-100 text-pink-700",
  WON: "bg-green-100 text-green-700",
  LOST: "bg-red-100 text-red-700",
};

// ─── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="w-12 h-12 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-lg shrink-0">
      {initials}
    </div>
  );
}

// ─── Info row ──────────────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  );
}

// ─── Construction stage stepper ────────────────────────────────────────────────
// const PHASE_META: Record<
//   ProjectPhase,
//   { label: string; icon: React.ReactNode }
// > = {
//   PIPES: { label: "Pipes", icon: <Wrench size={15} /> },
//   WIRING: { label: "Wiring", icon: <Zap size={15} /> },
//   SWITCHES: { label: "Switches", icon: <ToggleLeft size={15} /> },
//   LIGHTS: { label: "Lights", icon: <Lightbulb size={15} /> },
//   FANS: { label: "Fans", icon: <Wind size={15} /> },
// };

// const PHASE_ORDER: ProjectPhase[] = [
//   "PIPES",
//   "WIRING",
//   "SWITCHES",
//   "LIGHTS",
//   "FANS",
// ];

// const PHASE_STYLE: Record<PhaseStatus, { circle: string; label: string }> = {
//   COMPLETED: {
//     circle: "bg-violet-600 text-white",
//     label: "text-violet-600 font-semibold",
//   },
//   IN_PROGRESS: {
//     circle: "bg-violet-600 text-white ring-4 ring-violet-100",
//     label: "text-violet-700 font-semibold",
//   },
//   SKIPPED: { circle: "bg-gray-200 text-gray-400", label: "text-gray-400" },
//   NOT_STARTED: {
//     circle: "bg-gray-100 text-gray-400 border border-gray-200",
//     label: "text-gray-400",
//   },
// };

// function ConstructionStage({ lifecycle }: { lifecycle: LeadLifecycle }) {
//   const phases = PHASE_ORDER.map(
//     (phase) =>
//       lifecycle.phaseTracking.find((p) => p.phase === phase) ?? {
//         id: phase,
//         phase,
//         status: "NOT_STARTED" as PhaseStatus,
//       },
//   );

//   return (
//     <div className="space-y-2">
//       <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
//         Construction Stage
//       </p>
//       <div className="flex items-start">
//         {phases.map((p, index) => {
//           const meta = PHASE_META[p.phase];
//           const style = PHASE_STYLE[p.status];
//           const isLast = index === phases.length - 1;
//           const prevDone =
//             index === 0 ||
//             ["COMPLETED", "SKIPPED"].includes(phases[index - 1].status);
//           return (
//             <div key={p.phase} className="flex flex-col items-center flex-1">
//               <div className="flex items-center w-full">
//                 <div
//                   className={`flex-1 h-0.5 ${index === 0 ? "invisible" : prevDone ? "bg-violet-400" : "bg-gray-200"}`}
//                 />
//                 <div
//                   className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${style.circle}`}
//                 >
//                   {p.status === "COMPLETED" ? <Check size={14} /> : meta.icon}
//                 </div>
//                 <div
//                   className={`flex-1 h-0.5 ${isLast ? "invisible" : p.status === "COMPLETED" ? "bg-violet-400" : "bg-gray-200"}`}
//                 />
//               </div>
//               <span
//                 className={`mt-1.5 text-xs text-center leading-tight ${style.label}`}
//               >
//                 {meta.label}
//               </span>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

// ─── Activity timeline ─────────────────────────────────────────────────────────
const ACTIVITY_ICON: Record<LeadActivityType, React.ReactNode> = {
  CREATED: <span className="text-xs">✦</span>,
  STATUS_CHANGED: <span className="text-xs">⇄</span>,
  FOLLOW_UP_SET: <Calendar size={12} />,
  FOLLOW_UP_COMPLETED: <Check size={12} />,
  CONVERTED: <span className="text-xs">🎉</span>,
  REOPENED: <span className="text-xs">↩</span>,

  NOTE_ADDED: <span className="text-xs">📝</span>,
  LOST: <span className="text-xs">❌</span>,
  QUOTATION_CREATED: <span className="text-xs">📄</span>,
  QUOTATION_SENT: <span className="text-xs">📤</span>,
  QUOTATION_APPROVED: <span className="text-xs">✅</span>,
  QUOTATION_REJECTED: <span className="text-xs">🚫</span>,
};

const ACTIVITY_BG: Record<LeadActivityType, string> = {
  CREATED: "bg-blue-500",
  STATUS_CHANGED: "bg-orange-400",
  FOLLOW_UP_SET: "bg-violet-500",
  FOLLOW_UP_COMPLETED: "bg-green-500",
  CONVERTED: "bg-green-600",
  REOPENED: "bg-yellow-500",

  NOTE_ADDED: "bg-gray-400",
  LOST: "bg-red-500",
  QUOTATION_CREATED: "bg-sky-500",
  QUOTATION_SENT: "bg-indigo-500",
  QUOTATION_APPROVED: "bg-green-500",
  QUOTATION_REJECTED: "bg-red-600",
};

function Timeline({ activities }: { activities: LeadActivity[] }) {
  if (activities.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-2">No activity yet.</p>
    );
  }
  return (
    <div>
      {activities.map((a, index) => (
        <div key={a.id} className="flex gap-3">
          <div className="flex flex-col items-center shrink-0">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-white ${ACTIVITY_BG[a.type]}`}
            >
              {ACTIVITY_ICON[a.type]}
            </div>
            {index < activities.length - 1 && (
              <div className="w-px flex-1 bg-border mt-1" />
            )}
          </div>
          <div className="pb-5 flex-1 min-w-0">
            <p className="text-sm font-medium leading-snug">{a.message}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(a.createdAt).toLocaleString([], {
                dateStyle: "medium",
                timeStyle: "short",
              })}{" "}
              · {a.user?.name ?? "System"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main drawer ───────────────────────────────────────────────────────────────
interface Props {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
}

export default function LeadDetailDrawer({ lead, open, onClose }: Props) {
  const { data: leadDetails } = useLead(lead?.id ?? null);

  const fullLead = leadDetails ?? lead;
  const activities = fullLead?.activities ?? [];

  if (!fullLead) return null;
  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col p-0 overflow-y-auto"
      >
        {/* Header */}
        <SheetHeader className="px-4 pt-4 pb-3 border-b">
          <SheetTitle className="text-sm font-semibold text-muted-foreground">
            Lead Details
          </SheetTitle>
        </SheetHeader>

        {/* Identity */}
        <div className="flex items-start gap-3 px-4 py-4 border-b">
          <Avatar name={fullLead.name} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-bold">{fullLead.name}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[fullLead.status]}`}
              >
                {fullLead.status.replace(/_/g, " ")}
              </span>
            </div>
            {fullLead.mobile && (
              <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                <Phone size={12} />
                <span>{fullLead.mobile}</span>
              </div>
            )}
            {fullLead.city && (
              <div className="flex items-center gap-1.5 mt-0.5 text-sm text-muted-foreground">
                <MapPin size={12} />
                <span>{fullLead.city}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 px-4 py-4 space-y-5">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <InfoRow label="Source" value={fullLead.source} />
            <InfoRow
              label="Lead Created On"
              value={new Date(fullLead.createdAt).toLocaleDateString([], {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            />
            <InfoRow label="Contact Owner" value={fullLead.assignedTo?.name} />
            <InfoRow label="Email" value={fullLead.email} />
          </div>

          {fullLead.notes && (
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Notes</span>
              <p className="text-sm whitespace-pre-wrap">{fullLead.notes}</p>
            </div>
          )}

          {fullLead.notesHistory?.length ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Notes History
              </p>

              {fullLead.notesHistory.map((note) => (
                <div key={note.id} className="border rounded-md p-3">
                  <p className="text-sm">{note.note}</p>

                  <p className="text-xs text-muted-foreground mt-2">
                    {note.user?.name ?? "System"} ·{" "}
                    {new Date(note.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          {fullLead.quotations?.length ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Quotations
              </p>

              {fullLead.quotations.map((quotation) => (
                <div key={quotation.id} className="border rounded-md p-3">
                  <div className="flex justify-between">
                    <span className="font-medium">
                      {quotation.quotationNumber}
                    </span>

                    <span className="text-xs">{quotation.status}</span>
                  </div>

                  <p className="text-sm mt-2">
                    ₹{Number(quotation.totalAmount).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          {fullLead.customer ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Converted Customer
              </p>

              <p className="text-sm font-medium mt-2">
                {fullLead.customer.name}
              </p>
            </div>
          ) : null}

          {/* Construction stage
          {fullLead.status === "WON" &&
            (lifecycleLoading ? (
              <p className="text-xs text-muted-foreground">Loading stage...</p>
            ) : lifecycle ? (
              <>
                <div className="border-t" />
                <ConstructionStage lifecycle={lifecycle} />
              </>
            ) : null)} */}

          {/* Follow-up */}
          {fullLead.nextFollowUpAt && (
            <>
              <div className="border-t" />

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-violet-100">
                  <Calendar size={14} className="text-violet-600" />
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Next Follow-up
                  </p>

                  <p className="text-sm font-semibold">
                    {new Date(fullLead.nextFollowUpAt).toLocaleDateString([], {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {new Date(fullLead.nextFollowUpAt).toLocaleTimeString([], {
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Timeline */}
          <div className="border-t" />
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Timeline
            </p>
            <Timeline activities={activities} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
