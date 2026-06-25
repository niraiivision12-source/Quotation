import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Check, MapPin, Pencil, Phone } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { useCreateReminder } from "../reminder/reminder.query";
import { useUsers } from "../user/user.query";
import {
  useConvertLead,
  useLead,
  useUpdateLead,
} from "./lead.query";
import type {
  Lead,
  LeadActivity,
  LeadActivityType,
  LeadStatus,
} from "./lead.types";

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-yellow-100 text-yellow-700",
  FOLLOW_UP: "bg-orange-100 text-orange-700",
  QUOTATION_SENT: "bg-purple-100 text-purple-700",
  NEGOTIATION: "bg-pink-100 text-pink-700",
  WON: "bg-green-100 text-green-700",
  LOST: "bg-red-100 text-red-700",
};

const LEAD_STATUSES: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "FOLLOW_UP",
  "QUOTATION_SENT",
  "NEGOTIATION",
  "WON",
  "LOST",
];

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
      <p className="text-xs text-muted-foreground py-4">No activity yet.</p>
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

// ─── Edit lead dialog ──────────────────────────────────────────────────────────
const editSchema = z.object({
  name: z.string().min(2),
  mobile: z.string().min(10),
  email: z.string().optional(),
  city: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
  assignedToId: z.string().optional(),
});

type EditForm = z.infer<typeof editSchema>;

function EditLeadDialog({
  lead,
  open,
  onClose,
}: {
  lead: Lead;
  open: boolean;
  onClose: () => void;
}) {
  const mutation = useUpdateLead();
  const { data: usersData } = useUsers(1);

  const form = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: lead.name,
      mobile: lead.mobile,
      email: lead.email ?? "",
      city: lead.city ?? "",
      source: lead.source ?? "",
      notes: lead.notes ?? "",
      assignedToId: lead.assignedToId ?? "",
    },
  });

  const submit = async (data: EditForm) => {
    await mutation.mutateAsync({
      id: lead.id,
      data: { ...data, assignedToId: data.assignedToId || null },
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Lead — {lead.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(submit)} className="space-y-3">
          <Input placeholder="Name *" {...form.register("name")} />
          <Input placeholder="Mobile *" {...form.register("mobile")} />
          <Input placeholder="Email" {...form.register("email")} />
          <Input placeholder="City" {...form.register("city")} />
          <Select
            defaultValue={lead.source ?? ""}
            onValueChange={(v) => form.setValue("source", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Walk-in">Walk-in</SelectItem>
              <SelectItem value="WhatsApp">WhatsApp</SelectItem>
              <SelectItem value="Instagram">Instagram</SelectItem>
              <SelectItem value="Facebook">Facebook</SelectItem>
              <SelectItem value="Phone Call">Phone Call</SelectItem>
              <SelectItem value="Referral">Referral</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Notes" {...form.register("notes")} />
          <Select
            defaultValue={lead.assignedToId ?? ""}
            onValueChange={(v) => form.setValue("assignedToId", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Contact Owner" />
            </SelectTrigger>
            <SelectContent>
              {usersData?.items.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Status select with convert / follow-up dialogs ───────────────────────────
const convertSchema = z.object({
  projectName: z.string().min(2),
  location: z.string().optional(),
  estimatedBudget: z.number().optional().or(z.nan()),
});
type ConvertForm = z.infer<typeof convertSchema>;

function StatusSection({ lead }: { lead: Lead }) {
  const [convertOpen, setConvertOpen] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const updateMutation = useUpdateLead();
  const convertMutation = useConvertLead();
  const createReminderMutation = useCreateReminder();

  const form = useForm<ConvertForm>({ resolver: zodResolver(convertSchema) });

  const onChange = (status: string) => {
    if (status === "WON") {
      setConvertOpen(true);
    } else if (status === "FOLLOW_UP") {
      setFollowUpOpen(true);
    } else {
      updateMutation.mutate({ id: lead.id, data: { status } });
    }
  };

  const submitFollowUp = async () => {
    await updateMutation.mutateAsync({
      id: lead.id,
      data: { status: "FOLLOW_UP", nextFollowUpAt: followUpDate || null },
    });
    if (followUpDate) {
      await createReminderMutation.mutateAsync({
        title: `Follow up with ${lead.name}`,
        type: "LEAD",
        priority: "MEDIUM",
        dueAt: new Date(followUpDate).toISOString(),
        leadId: lead.id,
      });
    }
    setFollowUpDate("");
    setFollowUpOpen(false);
  };

  const submitConvert = async (data: ConvertForm) => {
    await convertMutation.mutateAsync({
      id: lead.id,
      data: {
        ...data,
        estimatedBudget: Number.isNaN(data.estimatedBudget)
          ? undefined
          : data.estimatedBudget,
      },
    });
    form.reset();
    setConvertOpen(false);
  };

  return (
    <>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">Status</span>
        <Select
          defaultValue={lead.status}
          onValueChange={onChange}
          disabled={lead.status === "WON"}
        >
          <SelectTrigger className="h-8 text-sm w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LEAD_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Follow-up dialog */}
      <Dialog open={followUpOpen} onOpenChange={(o) => { if (!o) setFollowUpOpen(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Follow-Up Date for {lead.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">
                Follow-up date & time
              </label>
              <Input
                type="datetime-local"
                value={followUpDate}
                min={new Date().toISOString().slice(0, 16)}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={submitFollowUp}
                disabled={updateMutation.isPending || !followUpDate}
              >
                {updateMutation.isPending ? "Saving..." : "Set Follow-Up"}
              </Button>
              <Button variant="outline" onClick={() => setFollowUpOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Convert dialog */}
      <Dialog open={convertOpen} onOpenChange={(o) => { if (!o) setConvertOpen(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert {lead.name} to Customer</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(submitConvert)}
            className="space-y-4"
          >
            <Input
              placeholder="Project Name *"
              {...form.register("projectName")}
            />
            <Input placeholder="Location" {...form.register("location")} />
            <Input
              placeholder="Estimated Budget"
              type="number"
              {...form.register("estimatedBudget", { valueAsNumber: true })}
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={convertMutation.isPending}>
                {convertMutation.isPending
                  ? "Converting..."
                  : "Confirm WON & Convert"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setConvertOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Drawer tab type ───────────────────────────────────────────────────────────
type DrawerTab = "timeline" | "quotations" | "notes";

// ─── Main drawer ───────────────────────────────────────────────────────────────
interface Props {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
}

export default function LeadDetailDrawer({ lead, open, onClose }: Props) {
  const { data: leadDetails } = useLead(lead?.id ?? null);
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DrawerTab>("timeline");

  const fullLead = leadDetails ?? lead;
  const activities = fullLead?.activities ?? [];

  if (!fullLead) return null;

  const tabs: { key: DrawerTab; label: string; count?: number }[] = [
    { key: "timeline", label: "Timeline" },
    {
      key: "quotations",
      label: "Quotations",
      count: fullLead.quotations?.length,
    },
    {
      key: "notes",
      label: "Notes",
      count: fullLead.notesHistory?.length,
    },
  ];

  return (
    <>
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
            {fullLead.status !== "WON" && (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => setEditOpen(true)}
              >
                <Pencil size={13} className="mr-1" />
                Edit
              </Button>
            )}
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
              <InfoRow
                label="Contact Owner"
                value={fullLead.assignedTo?.name}
              />
              <InfoRow label="Email" value={fullLead.email} />
            </div>

            {/* Status change */}
            <StatusSection lead={fullLead} />

            {fullLead.notes && (
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">Notes</span>
                <p className="text-sm whitespace-pre-wrap">{fullLead.notes}</p>
              </div>
            )}

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
                      {new Date(fullLead.nextFollowUpAt).toLocaleDateString(
                        [],
                        { day: "numeric", month: "short", year: "numeric" },
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(fullLead.nextFollowUpAt).toLocaleTimeString(
                        [],
                        { timeStyle: "short" },
                      )}
                    </p>
                  </div>
                </div>
              </>
            )}

            {fullLead.customer && (
              <>
                <div className="border-t" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Converted Customer
                  </p>
                  <p className="text-sm font-medium mt-2">
                    {fullLead.customer.name}
                  </p>
                </div>
              </>
            )}

            {/* Tabs */}
            <div className="border-t -mx-4" />
            <div className="-mx-4">
              <div className="flex border-b px-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                      activeTab === tab.key
                        ? "border-violet-600 text-violet-600"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                    {tab.count ? (
                      <span className="ml-1 text-xs">({tab.count})</span>
                    ) : null}
                  </button>
                ))}
              </div>

              <div className="px-4 pt-4">
                {activeTab === "timeline" && (
                  <Timeline activities={activities} />
                )}

                {activeTab === "quotations" && (
                  <>
                    {fullLead.quotations?.length ? (
                      <div className="space-y-3">
                        {fullLead.quotations.map((q) => (
                          <div key={q.id} className="border rounded-md p-3">
                            <div className="flex justify-between">
                              <span className="font-medium text-sm">
                                {q.quotationNumber}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {q.status}
                              </span>
                            </div>
                            <p className="text-sm mt-1">
                              ₹{Number(q.totalAmount).toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(q.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground py-4">
                        No quotations yet.
                      </p>
                    )}
                  </>
                )}

                {activeTab === "notes" && (
                  <>
                    {fullLead.notesHistory?.length ? (
                      <div className="space-y-3">
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
                    ) : (
                      <p className="text-xs text-muted-foreground py-4">
                        No notes yet.
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {editOpen && (
        <EditLeadDialog
          lead={fullLead}
          open={editOpen}
          onClose={() => setEditOpen(false)}
        />
      )}
    </>
  );
}
