import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Calendar,
  Check,
  FileText,
  Mail,
  MapPin,
  Pencil,
  Phone,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import LeadStatusChangeModal from "@/modules/lead/LeadStatusChangeModal";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import LeadTasks from "@/modules/lead/components/LeadTasks";
import {
  useCreateReminder,
  useCompleteReminder,
  useUpdateReminder,
  useDeleteReminder,
} from "@/modules/reminder/reminder.query";

import { CopyPhone } from "@/components/ui/CopyPhone";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUsers } from "@/modules/user/user.query";
import {
  useConvertLead,
  useLead,
  useUpdateLead,
} from "@/modules/lead/lead.query";
import { useQuotation } from "@/modules/quotation/quotation.query";
import QuotationPreviewDialog from "@/modules/quotation/components/QuotationPreviewDialog";
import type {
  Lead,
  LeadActivity,
  LeadActivityType,
  LeadStatus,
} from "@/modules/lead/lead.types";

// ─── Status config ──────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700 ring-blue-200",
  CONTACTED: "bg-amber-100 text-amber-700 ring-amber-200",
  NOT_RESPONDING: "bg-orange-100 text-orange-700 ring-orange-200",
  QUOTATION_SENT: "bg-purple-100 text-purple-700 ring-purple-200",
  NEGOTIATION: "bg-pink-100 text-pink-700 ring-pink-200",
  WON: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  LOST: "bg-red-100 text-red-600 ring-red-200",
};

const STATUS_DOT: Record<string, string> = {
  NEW: "bg-blue-500",
  CONTACTED: "bg-amber-500",
  NOT_RESPONDING: "bg-orange-500",
  QUOTATION_SENT: "bg-purple-500",
  NEGOTIATION: "bg-pink-500",
  WON: "bg-emerald-500",
  LOST: "bg-red-500",
};

const LEAD_STATUSES: LeadStatus[] = [
  "NEW", "CONTACTED", "NOT_RESPONDING", "QUOTATION_SENT", "NEGOTIATION", "WON", "LOST",
];

// ─── Avatar ─────────────────────────────────────────────────────────────────────
function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-md">
      {initials}
    </div>
  );
}

// ─── Info row ───────────────────────────────────────────────────────────────────
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 text-gray-900">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-gray-900 uppercase tracking-wide leading-none mb-1">
          {label}
        </p>
        <p className="text-sm font-medium text-gray-900">{value || "—"}</p>
      </div>
    </div>
  );
}

// ─── Timeline ───────────────────────────────────────────────────────────────────
const ACTIVITY_ICON: Record<LeadActivityType, React.ReactNode> = {
  CREATED: <span className="text-[9px] font-black">NEW</span>,
  STATUS_CHANGED: <span className="text-xs font-bold">⇄</span>,
  FOLLOW_UP_SET: <Calendar size={11} />,
  FOLLOW_UP_COMPLETED: <Check size={11} />,
  REMINDER_CREATED: <Calendar size={11} />,
  REMINDER_COMPLETED: <Check size={11} />,
  CONVERTED: <Check size={11} />,
  REOPENED: <span className="text-xs">↩</span>,
  NOTE_ADDED: <FileText size={11} />,
  LOST: <span className="text-xs font-bold">✕</span>,
  QUOTATION_CREATED: <FileText size={11} />,
  QUOTATION_SENT: <FileText size={11} />,
  QUOTATION_APPROVED: <Check size={11} />,
  QUOTATION_REJECTED: <span className="text-xs font-bold">✕</span>,
};

const ACTIVITY_COLOR: Record<LeadActivityType, string> = {
  CREATED: "bg-blue-50 text-blue-600 border-blue-100",
  STATUS_CHANGED: "bg-orange-50 text-orange-500 border-orange-100",
  FOLLOW_UP_SET: "bg-violet-50 text-violet-600 border-violet-100",
  FOLLOW_UP_COMPLETED: "bg-emerald-50 text-emerald-600 border-emerald-100",
  REMINDER_CREATED: "bg-violet-50 text-violet-600 border-violet-100",
  REMINDER_COMPLETED: "bg-emerald-50 text-emerald-600 border-emerald-100",
  CONVERTED: "bg-emerald-50 text-emerald-600 border-emerald-100",
  REOPENED: "bg-amber-50 text-amber-600 border-amber-100",
  NOTE_ADDED: "bg-gray-50 text-gray-900 border-gray-100",
  LOST: "bg-red-50 text-red-500 border-red-100",
  QUOTATION_CREATED: "bg-sky-50 text-sky-600 border-sky-100",
  QUOTATION_SENT: "bg-indigo-50 text-indigo-600 border-indigo-100",
  QUOTATION_APPROVED: "bg-emerald-50 text-emerald-600 border-emerald-100",
  QUOTATION_REJECTED: "bg-red-50 text-red-500 border-red-100",
};

function getDateLabel(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" });
}

function Timeline({ activities }: { activities: LeadActivity[] }) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <Calendar size={20} className="text-gray-900" />
        </div>
        <p className="text-sm font-medium text-gray-900">No activity yet</p>
        <p className="text-xs text-gray-900 mt-1">Actions will appear here as they happen</p>
      </div>
    );
  }

  const groups: { label: string; items: LeadActivity[] }[] = [];
  for (const a of activities) {
    const label = getDateLabel(new Date(a.createdAt));
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(a);
    else groups.push({ label, items: [a] });
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <div key={group.label}>
          {/* Date header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-xs font-semibold text-gray-900 tracking-wider uppercase">
              {group.label}
            </span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Items */}
          <div className="space-y-0">
            {group.items.map((a, index) => (
              <div key={a.id} className="flex items-start">
                {/* Time */}
                <div className="w-16 shrink-0 text-right pr-4 pt-1">
                  <span className="text-[11px] text-gray-900 whitespace-nowrap tabular-nums">
                    {new Date(a.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                {/* Connector */}
                <div className="flex flex-col items-center shrink-0 w-6 mr-3">
                  <div className="w-2.5 h-2.5 rounded-full border-2 border-gray-300 bg-white mt-1.5 shrink-0 z-10" />
                  {index < group.items.length - 1 && (
                    <div className="w-px bg-gray-150 flex-1 mt-1" style={{ minHeight: "28px", background: "#e5e7eb" }} />
                  )}
                </div>

                {/* Content */}
                <div className="flex items-start gap-2.5 pb-4 flex-1 min-w-0">
                  <div className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${ACTIVITY_COLOR[a.type]}`}>
                    {ACTIVITY_ICON[a.type]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900 leading-snug">{a.message}</p>
                    {a.metadata && (a.metadata as any).reason && (
                      <div className="mt-1">
                        <span className="inline-flex text-[11px] font-semibold text-violet-700 bg-violet-50 border border-violet-100 rounded-md px-1.5 py-0.5">
                          Reason: {(a.metadata as any).reason}
                        </span>
                      </div>
                    )}
                    <p className="text-[11px] text-gray-500 mt-0.5">{a.user?.name ?? "System"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Edit dialog ────────────────────────────────────────────────────────────────
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

function EditLeadDialog({ lead, open, onClose }: { lead: Lead; open: boolean; onClose: () => void }) {
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
            <span className="inline-flex items-center px-3 border border-r-0 rounded-l-md bg-muted text-gray-600 text-sm font-medium">+91</span>
            <Input className="rounded-l-none" placeholder="Mobile *" {...form.register("mobile")} />
          </div>
          <Input placeholder="Email" {...form.register("email")} />
          <Input placeholder="City" {...form.register("city")} />
          <Select defaultValue={lead.source ?? ""} onValueChange={(v) => form.setValue("source", v)}>
            <SelectTrigger><SelectValue placeholder="Select Source" /></SelectTrigger>
            <SelectContent>
              {["Walk-in","WhatsApp","Instagram","Facebook","Phone Call","Referral"].map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input placeholder="Notes" {...form.register("notes")} />
          <Select defaultValue={lead.assignedToId ?? ""} onValueChange={(v) => form.setValue("assignedToId", v)}>
            <SelectTrigger><SelectValue placeholder="Assign To" /></SelectTrigger>
            <SelectContent>
              {usersData?.items.map((user) => (
                <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Status section ─────────────────────────────────────────────────────────────
const convertSchema = z.object({
  projectName: z.string().min(2, "Project Name must be at least 2 characters"),
  location: z.string().optional(),
  currentPhase: z.string().min(1, "Phase is required"),
});
type ConvertForm = z.infer<typeof convertSchema>;

function StatusSection({ lead }: { lead: Lead }) {
  const navigate = useNavigate();
  const [convertOpen, setConvertOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<LeadStatus | null>(null);
  const convertMutation = useConvertLead();
  const form = useForm<ConvertForm>({ resolver: zodResolver(convertSchema) });

  const onChange = (status: string) => {
    if (status === "QUOTATION_SENT") {
      navigate(`/quotations?leadId=${lead.id}`);
      return;
    }
    setTargetStatus(status as LeadStatus);
  };

  const submitConvert = async (data: ConvertForm) => {
    await convertMutation.mutateAsync({
      id: lead.id,
      data: {
        projectName: data.projectName,
        location: data.location || undefined,
        currentPhase: data.currentPhase,
      },
    });
    form.reset();
    setConvertOpen(false);
  };

  return (
    <>
      <div className="space-y-2">
        <Select defaultValue={lead.status} onValueChange={onChange} disabled={lead.status === "WON"}>
          <SelectTrigger className="h-9 text-sm w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LEAD_STATUSES.map((s) => {
              const allowedTransitions: Record<LeadStatus, LeadStatus[]> = {
                NEW: ["NEW", "CONTACTED", "NOT_RESPONDING"],
                CONTACTED: ["CONTACTED", "NOT_RESPONDING", "QUOTATION_SENT"],
                NOT_RESPONDING: ["NOT_RESPONDING", "CONTACTED", "QUOTATION_SENT", "LOST"],
                QUOTATION_SENT: ["QUOTATION_SENT", "NEGOTIATION", "WON", "LOST"],
                NEGOTIATION: ["NEGOTIATION", "WON", "LOST"],
                WON: ["WON"],
                LOST: ["LOST", "NOT_RESPONDING"]
              };
              const allowed = allowedTransitions[lead.status] || [];
              if (!allowed.includes(s)) return null;

              return <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>;
            })}
          </SelectContent>
        </Select>
        {lead.status === "WON" && !lead.customer && (
          <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setConvertOpen(true)}>
            Convert to Customer
          </Button>
        )}
      </div>

      {targetStatus && (
        <LeadStatusChangeModal
          lead={lead}
          targetStatus={targetStatus}
          onClose={() => setTargetStatus(null)}
          onSuccess={() => {
            setTargetStatus(null);
            if (targetStatus === "WON") {
              setConvertOpen(true);
            }
          }}
        />
      )}

      <Dialog open={convertOpen} onOpenChange={(o) => { if (!o) setConvertOpen(false); }}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader><DialogTitle>Convert {lead.name} to Customer</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(submitConvert)} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Project Name *</label>
              <Input placeholder="Project Name *" {...form.register("projectName")} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Location (Optional)</label>
              <Input placeholder="Location" {...form.register("location")} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Current Phase *</label>
              <select
                className="w-full text-sm border rounded-md p-2 h-10 focus:outline-none focus:ring-1 focus:ring-ring bg-white"
                {...form.register("currentPhase")}
              >
                <option value="">Select current phase</option>
                <option value="PIPES">Pipes</option>
                <option value="WIRING">Wiring</option>
                <option value="SWITCHES">Switches</option>
                <option value="LIGHTS">Lights</option>
                <option value="FANS">Fans</option>
                <option value="OTHERS">Others</option>
              </select>
              {form.formState.errors.currentPhase && (
                <p className="text-xs text-red-500 mt-1">{form.formState.errors.currentPhase.message}</p>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={convertMutation.isPending}>
                {convertMutation.isPending ? "Converting..." : "Confirm & Convert"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setConvertOpen(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────────
type PageTab = "timeline" | "quotations" | "notes" | "followups" | "tasks";

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<PageTab>("timeline");
  const [selectedReminder, setSelectedReminder] = useState<any>(null);

  const [addReminderOpen, setAddReminderOpen] = useState(false);
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderDesc, setReminderDesc] = useState("");
  const [reminderPriority, setReminderPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [reminderDue, setReminderDue] = useState("");

  const createReminderMutation = useCreateReminder();
  const completeReminderMutation = useCompleteReminder();
  const updateReminderMutation = useUpdateReminder();
  const deleteReminderMutation = useDeleteReminder();

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderTitle.trim() || !reminderDue || !lead) return;
    try {
      await createReminderMutation.mutateAsync({
        title: reminderTitle,
        description: reminderDesc,
        type: "LEAD",
        priority: reminderPriority,
        dueAt: new Date(reminderDue).toISOString(),
        leadId: lead.id,
      });
      toast.success("Follow-up reminder added");
      setReminderTitle("");
      setReminderDesc("");
      setReminderPriority("MEDIUM");
      setReminderDue("");
      setAddReminderOpen(false);
    } catch (err) {
      toast.error("Failed to add follow-up");
    }
  };

  const [selectedPreviewQuoteId, setSelectedPreviewQuoteId] = useState<string | null>(null);
  const { data: fullSelectedQuote } = useQuotation(selectedPreviewQuoteId || undefined);
  const { data: usersData } = useUsers(1);
  const users = usersData?.items ?? [];

  const mapSelectedQuoteForLead = () => {
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

  const leadPreviewData = mapSelectedQuoteForLead();

  const ids: string[] = (location.state as { ids?: string[] })?.ids ?? [];
  const currentIndex = ids.indexOf(id ?? "");
  const prevId = currentIndex > 0 ? ids[currentIndex - 1] : null;
  const nextId = currentIndex < ids.length - 1 ? ids[currentIndex + 1] : null;

  const goTo = (targetId: string) => {
    navigate(`/leads/${targetId}`, { state: { ids } });
    setActiveTab("timeline");
  };

  const { data: lead, isLoading } = useLead(id ?? null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-600 text-sm">
        Lead not found.
      </div>
    );
  }

  const activities = lead.activities ?? [];
  const tabs: { key: PageTab; label: string; count?: number }[] = [
    { key: "timeline", label: "Timeline", count: activities.length },
    { key: "quotations", label: "Quotations", count: lead.quotations?.length },
    { key: "notes", label: "Notes", count: lead.notesHistory?.length },
    { key: "followups", label: "Follow-ups", count: lead.reminders?.length },
    { key: "tasks", label: "Tasks" },
  ];

  return (
    <div className="w-full min-h-full bg-gray-50/60">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => navigate("/leads")}
          className="flex items-center gap-1.5 text-sm text-gray-900 hover:text-gray-900 transition-colors font-medium"
        >
          <ArrowLeft size={15} />
          Back to Leads
        </button>

        {ids.length > 0 && (
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-full px-1 py-1 shadow-sm">
            <button
              onClick={() => prevId && goTo(prevId)}
              disabled={!prevId}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 text-gray-700"
              title="Previous lead"
            >
              <ArrowLeft size={14} />
            </button>
            <span className="text-xs text-gray-500 px-1 tabular-nums">
              {currentIndex + 1} / {ids.length}
            </span>
            <button
              onClick={() => nextId && goTo(nextId)}
              disabled={!nextId}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 text-gray-700"
              title="Next lead"
            >
              <ArrowLeft size={14} className="rotate-180" />
            </button>
          </div>
        )}
      </div>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
        <div className="flex items-center gap-5 flex-wrap">
          <Avatar name={lead.name} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap mb-1">
              <h1 className="text-xl font-bold text-gray-900 leading-tight">{lead.name}</h1>
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ${STATUS_COLORS[lead.status]}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[lead.status]}`} />
                {lead.status.replace(/_/g, " ")}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-1">
              {lead.mobile && (
                <div className="flex items-center gap-1.5 text-sm text-gray-900">
                  <Phone size={13} className="shrink-0" />
                  <CopyPhone mobile={lead.mobile} />
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-1.5 text-sm text-gray-900">
                  <Mail size={13} className="shrink-0" />
                  <span>{lead.email}</span>
                </div>
              )}
              {lead.city && (
                <div className="flex items-center gap-1.5 text-sm text-gray-900">
                  <MapPin size={13} className="shrink-0" />
                  <span>{lead.city}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" className="h-9 px-4 text-sm font-medium" onClick={() => setEditOpen(true)}>
              <Pencil size={13} className="mr-1.5" />
              Edit
            </Button>
            <Button size="sm" className="h-9 px-4 text-sm font-medium bg-violet-600 hover:bg-violet-700" onClick={() => navigate(`/quotations?leadId=${lead.id}`)}>
              <FileText size={13} className="mr-1.5" />
              Quotation
            </Button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col lg:flex-row" style={{ height: "calc(100vh - 240px)" }}>

        {/* Left panel */}
        <div className="w-full lg:w-72 shrink-0 border-b lg:border-b-0 lg:border-r border-gray-100 overflow-y-auto">
          {/* Lead Info */}
          <div className="px-5 pt-5 pb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-900 mb-1">Lead Info</p>
          </div>
          <div className="px-5 divide-y divide-gray-50">
            <InfoRow icon={<FileText size={14} />} label="Source" value={lead.source} />
            <InfoRow icon={<Calendar size={14} />} label="Created On" value={new Date(lead.createdAt).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })} />
            <InfoRow icon={<User size={14} />} label="Assigned To" value={lead.assignedTo?.name} />
            <InfoRow icon={<Mail size={14} />} label="Email" value={lead.email} />
          </div>

          {/* Status */}
          <div className="border-t border-gray-100 px-5 pt-4 pb-4 mt-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-900 mb-3">Status</p>
            <StatusSection lead={lead} />
          </div>

          {/* Notes */}
          {lead.notes && (
            <div className="border-t border-gray-100 px-5 pt-4 pb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-900 mb-2">Notes</p>
              <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">{lead.notes}</p>
            </div>
          )}

          {/* Follow-up */}
          {lead.nextFollowUpAt && (
            <div className="border-t border-gray-100 px-5 pt-4 pb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-900 mb-3">Next Follow-up</p>
              <div className="flex items-center gap-3 bg-violet-50 rounded-xl p-3">
                <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                  <Calendar size={15} className="text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(lead.nextFollowUpAt).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <p className="text-xs text-violet-500 font-medium">
                    {new Date(lead.nextFollowUpAt).toLocaleTimeString([], { timeStyle: "short" })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Converted customer */}
          {lead.customer && (
            <div className="border-t border-gray-100 px-5 pt-4 pb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-900 mb-2">Converted Customer</p>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">
                  {lead.customer.name[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-900">{lead.customer.name}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Tabs */}
          <div className="flex border-b border-gray-100 px-6 bg-gray-50/50 shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-1 py-4 mr-6 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "text-violet-600"
                    : "text-gray-900 hover:text-gray-900"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`ml-1.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.key ? "bg-violet-100 text-violet-600" : "bg-gray-100 text-gray-900"
                  }`}>
                    {tab.count}
                  </span>
                )}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "timeline" && <Timeline activities={activities} />}

            {activeTab === "quotations" && (
              <>
                {lead.quotations?.length ? (
                  <div className="space-y-3">
                    {lead.quotations.map((q) => (
                      <div
                        key={q.id}
                        onClick={() => setSelectedPreviewQuoteId(q.id)}
                        className="border border-gray-100 rounded-xl p-4 hover:border-violet-300 transition-colors cursor-pointer hover:shadow-xs hover:bg-slate-50/20"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-sm text-gray-900">{q.quotationNumber}</span>
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                            q.status === "APPROVED" ? "bg-emerald-100 text-emerald-700"
                            : q.status === "REJECTED" ? "bg-red-100 text-red-600"
                            : q.status === "SENT" ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-900"
                          }`}>
                            {q.status}
                          </span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">₹{Number(q.totalAmount).toLocaleString()}</p>
                        <p className="text-xs text-gray-900 mt-1">{new Date(q.createdAt).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                      <FileText size={20} className="text-gray-900" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">No quotations yet</p>
                  </div>
                )}
              </>
            )}

            {activeTab === "notes" && (
              <>
                {lead.notesHistory?.length ? (
                  <div className="space-y-3">
                    {lead.notesHistory.map((note) => (
                      <div key={note.id} className="border border-gray-100 rounded-xl p-4">
                        <p className="text-sm text-gray-900 leading-relaxed">{note.note}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {note.user?.name ?? "System"} · {new Date(note.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                      <FileText size={20} className="text-gray-900" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">No notes yet</p>
                  </div>
                )}
              </>
            )}

            {activeTab === "followups" && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm font-semibold text-gray-700">Follow-up reminders</p>
                  <Button size="sm" onClick={() => setAddReminderOpen(true)}>
                    + Add Follow-up
                  </Button>
                </div>
                {lead.reminders?.length ? (
                  <div className="space-y-4">
                    <div className="border border-gray-150 rounded-xl overflow-hidden bg-white shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Due Date</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Completed Date</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned User</th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 bg-white">
                            {lead.reminders.map((reminder) => {
                              const isCompleted = reminder.status === "COMPLETED";
                              return (
                                <tr key={reminder.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap font-medium">
                                    {new Date(reminder.dueAt).toLocaleString()}
                                  </td>
                                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-0.5 rounded-full font-semibold ${
                                      reminder.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                                      reminder.status === "MISSED" ? "bg-red-100 text-red-700" :
                                      reminder.status === "CANCELLED" ? "bg-gray-100 text-gray-500" :
                                      "bg-yellow-100 text-yellow-700"
                                    }`}>
                                      {reminder.status}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                                    {reminder.completedAt ? new Date(reminder.completedAt).toLocaleString() : "—"}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                                    {reminder.user?.name ?? "System"}
                                  </td>
                                  <td className="px-4 py-3 text-right text-sm whitespace-nowrap flex items-center justify-end gap-1.5">
                                    {isCompleted && (
                                      <Button
                                        size="xs"
                                        variant="ghost"
                                        onClick={() => setSelectedReminder(reminder)}
                                      >
                                        View details
                                      </Button>
                                    )}
                                    {!isCompleted && reminder.status !== "CANCELLED" && (
                                      <>
                                        <Button
                                          size="xs"
                                          className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 text-xs"
                                          onClick={() => completeReminderMutation.mutate(reminder.id)}
                                        >
                                          Done
                                        </Button>
                                        <Button
                                          size="xs"
                                          variant="outline"
                                          className="text-red-500 hover:text-red-600 hover:bg-red-50 px-2 py-1 text-xs"
                                          onClick={() => updateReminderMutation.mutate({ id: reminder.id, data: { status: "CANCELLED" } })}
                                        >
                                          Cancel
                                        </Button>
                                      </>
                                    )}
                                    <Button
                                      size="xs"
                                      variant="ghost"
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 text-xs"
                                      onClick={() => deleteReminderMutation.mutate(reminder.id)}
                                    >
                                      Delete
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                      <Calendar size={20} className="text-gray-900" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">No reminders yet</p>
                  </div>
                )}
              </>
            )}

            {activeTab === "tasks" && (
              <LeadTasks leadId={lead.id} />
            )}
          </div>
        </div>
      </div>

      {editOpen && (
        <EditLeadDialog lead={lead} open={editOpen} onClose={() => setEditOpen(false)} />
      )}

      {selectedReminder && (
        <Dialog open={!!selectedReminder} onOpenChange={(o) => { if (!o) setSelectedReminder(null); }}>
          <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
            <DialogHeader>
              <DialogTitle>Completed Follow-Up Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2 text-sm text-gray-800">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</p>
                <p className="mt-1 text-sm font-medium">{selectedReminder.title}</p>
              </div>
              {selectedReminder.description && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</p>
                  <p className="mt-1 text-sm">{selectedReminder.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Due Date & Time</p>
                  <p className="mt-1 text-sm">{new Date(selectedReminder.dueAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Completed Date & Time</p>
                  <p className="mt-1 text-sm">
                    {selectedReminder.completedAt ? new Date(selectedReminder.completedAt).toLocaleString() : "—"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</p>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold mt-1 ${
                    selectedReminder.priority === "CRITICAL" ? "bg-red-100 text-red-700" :
                    selectedReminder.priority === "HIGH" ? "bg-orange-100 text-orange-700" :
                    selectedReminder.priority === "MEDIUM" ? "bg-yellow-100 text-yellow-700" :
                    "bg-blue-100 text-blue-700"
                  }`}>
                    {selectedReminder.priority}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned User</p>
                  <p className="mt-1 text-sm font-medium">{selectedReminder.user?.name ?? "System"}</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setSelectedReminder(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={addReminderOpen} onOpenChange={setAddReminderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Follow-up Reminder</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddReminder} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Title *</label>
              <Input
                value={reminderTitle}
                onChange={(e) => setReminderTitle(e.target.value)}
                className="mt-1"
                placeholder="Follow up call"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <Textarea
                value={reminderDesc}
                onChange={(e) => setReminderDesc(e.target.value)}
                className="mt-1 text-xs"
                placeholder="Discuss options..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Priority</label>
                <Select value={reminderPriority} onValueChange={(v: any) => setReminderPriority(v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Due Date & Time *</label>
                <Input
                  type="datetime-local"
                  value={reminderDue}
                  onChange={(e) => setReminderDue(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={createReminderMutation.isPending}>
              {createReminderMutation.isPending ? "Adding..." : "Add Follow-up"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {selectedPreviewQuoteId && leadPreviewData && (
        <QuotationPreviewDialog
          open={!!selectedPreviewQuoteId}
          payload={leadPreviewData.payload}
          quotationType={leadPreviewData.payload.type}
          targetName={
            leadPreviewData.payload.type === "WALK_IN_CUSTOMER"
              ? leadPreviewData.payload.walkInName
              : fullSelectedQuote?.lead?.name || fullSelectedQuote?.customer?.name || ""
          }
          projectName={fullSelectedQuote?.project?.projectName}
          items={leadPreviewData.items}
          users={users}
          subtotal={leadPreviewData.subtotal}
          discountAmount={leadPreviewData.discountAmount}
          totalAmount={leadPreviewData.totalAmount}
          isCreating={false}
          onOpenChange={(open) => !open && setSelectedPreviewQuoteId(null)}
          onConfirm={() => setSelectedPreviewQuoteId(null)}
          onEdit={() => {
            navigate(`/quotations?editId=${selectedPreviewQuoteId}`);
            setSelectedPreviewQuoteId(null);
          }}
        />
      )}
    </div>
  );
}
