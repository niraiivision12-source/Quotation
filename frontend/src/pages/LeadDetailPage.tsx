import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Calendar,
  Check,
  FileText,
  MapPin,
  Pencil,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

import { CopyPhone } from "@/components/ui/CopyPhone";
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
import { useCreateReminder } from "@/modules/reminder/reminder.query";
import { useUsers } from "@/modules/user/user.query";
import {
  useConvertLead,
  useLead,
  useUpdateLead,
} from "@/modules/lead/lead.query";
import type {
  Lead,
  LeadActivity,
  LeadActivityType,
  LeadStatus,
} from "@/modules/lead/lead.types";

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
    <div className="w-14 h-14 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xl shrink-0">
      {initials}
    </div>
  );
}

// ─── Info card ─────────────────────────────────────────────────────────────────
function InfoCard({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="bg-gray-50 rounded-lg px-4 py-3">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium">{value || "—"}</p>
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
      <p className="text-sm text-muted-foreground py-6">No activity yet.</p>
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
      mobile: lead.mobile?.replace(/^\+?91/, "") ?? "",
      email: lead.email ?? "",
      city: lead.city ?? "",
      source: lead.source ?? "",
      notes: lead.notes ?? "",
      assignedToId: lead.assignedToId ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: lead.name,
        mobile: lead.mobile?.replace(/^\+?91/, "") ?? "",
        email: lead.email ?? "",
        city: lead.city ?? "",
        source: lead.source ?? "",
        notes: lead.notes ?? "",
        assignedToId: lead.assignedToId ?? "",
      });
    }
  }, [open, lead]);

  const submit = async (data: EditForm) => {
    await mutation.mutateAsync({
      id: lead.id,
      data: {
        ...data,
        mobile: "+91" + data.mobile.replace(/^\+?91/, ""),
        assignedToId: data.assignedToId || null,
      },
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
          <div className="flex">
            <span className="inline-flex items-center px-3 border border-r-0 rounded-l-md bg-muted text-muted-foreground text-sm font-medium">
              +91
            </span>
            <Input
              className="rounded-l-none"
              placeholder="Mobile *"
              {...form.register("mobile")}
            />
          </div>
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

// ─── Status section ────────────────────────────────────────────────────────────
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
      <div className="flex items-center gap-3 flex-wrap">
        <Select
          defaultValue={lead.status}
          onValueChange={onChange}
          disabled={lead.status === "WON"}
        >
          <SelectTrigger className="h-9 text-sm w-48">
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

        {lead.status === "WON" && !lead.customer && (
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => setConvertOpen(true)}
          >
            Convert to Customer
          </Button>
        )}
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
          <form onSubmit={form.handleSubmit(submitConvert)} className="space-y-4">
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
                {convertMutation.isPending ? "Converting..." : "Confirm WON & Convert"}
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

// ─── Page ──────────────────────────────────────────────────────────────────────
type PageTab = "timeline" | "quotations" | "notes";

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<PageTab>("timeline");

  const { data: lead, isLoading } = useLead(id ?? null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Lead not found.
      </div>
    );
  }

  const activities = lead.activities ?? [];

  const tabs: { key: PageTab; label: string; count?: number }[] = [
    { key: "timeline", label: "Timeline" },
    { key: "quotations", label: "Quotations", count: lead.quotations?.length },
    { key: "notes", label: "Notes", count: lead.notesHistory?.length },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate("/leads")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Leads
      </button>

      {/* Header card */}
      <div className="bg-white border rounded-xl p-5 mb-4">
        <div className="flex items-start gap-4 flex-wrap">
          <Avatar name={lead.name} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{lead.name}</h1>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_COLORS[lead.status]}`}
              >
                {lead.status.replace(/_/g, " ")}
              </span>
            </div>
            {lead.mobile && (
              <div className="mt-1">
                <CopyPhone mobile={lead.mobile} />
              </div>
            )}
            {lead.city && (
              <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                <MapPin size={13} />
                <span>{lead.city}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil size={13} className="mr-1" />
              Edit
            </Button>
            <Button
              size="sm"
              onClick={() => navigate(`/quotations?leadId=${lead.id}`)}
            >
              <FileText size={13} className="mr-1" />
              Quotation
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column: Info + Status */}
        <div className="lg:col-span-1 space-y-4">
          {/* Info grid */}
          <div className="bg-white border rounded-xl p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Lead Info
            </h2>
            <div className="grid grid-cols-1 gap-3">
              <InfoCard label="Source" value={lead.source} />
              <InfoCard
                label="Lead Created On"
                value={new Date(lead.createdAt).toLocaleDateString([], {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              />
              <InfoCard label="Contact Owner" value={lead.assignedTo?.name} />
              <InfoCard label="Email" value={lead.email} />
            </div>
          </div>

          {/* Status */}
          <div className="bg-white border rounded-xl p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Status
            </h2>
            <StatusSection lead={lead} />
          </div>

          {/* Notes */}
          {lead.notes && (
            <div className="bg-white border rounded-xl p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Notes
              </h2>
              <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
            </div>
          )}

          {/* Follow-up */}
          {lead.nextFollowUpAt && (
            <div className="bg-white border rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-violet-100">
                  <Calendar size={16} className="text-violet-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Next Follow-up</p>
                  <p className="text-sm font-semibold">
                    {new Date(lead.nextFollowUpAt).toLocaleDateString([], {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(lead.nextFollowUpAt).toLocaleTimeString([], {
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Converted customer */}
          {lead.customer && (
            <div className="bg-white border rounded-xl p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Converted Customer
              </h2>
              <p className="text-sm font-medium">{lead.customer.name}</p>
            </div>
          )}
        </div>

        {/* Right column: Tabs */}
        <div className="lg:col-span-2 bg-white border rounded-xl overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b px-4">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
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

          <div className="p-5">
            {activeTab === "timeline" && (
              <Timeline activities={activities} />
            )}

            {activeTab === "quotations" && (
              <>
                {lead.quotations?.length ? (
                  <div className="space-y-3">
                    {lead.quotations.map((q) => (
                      <div key={q.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <span className="font-medium text-sm">
                            {q.quotationNumber}
                          </span>
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                            {q.status}
                          </span>
                        </div>
                        <p className="text-base font-semibold mt-1">
                          ₹{Number(q.totalAmount).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(q.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-6">
                    No quotations yet.
                  </p>
                )}
              </>
            )}

            {activeTab === "notes" && (
              <>
                {lead.notesHistory?.length ? (
                  <div className="space-y-3">
                    {lead.notesHistory.map((note) => (
                      <div key={note.id} className="border rounded-lg p-4">
                        <p className="text-sm">{note.note}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {note.user?.name ?? "System"} ·{" "}
                          {new Date(note.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-6">
                    No notes yet.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {editOpen && (
        <EditLeadDialog
          lead={lead}
          open={editOpen}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );
}
