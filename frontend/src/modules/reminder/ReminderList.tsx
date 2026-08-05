import {
  Bell,
  Check,
  CheckCircle,
  Clock,
  MoreVertical,
  Pencil,
  Trash2,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import PageHeader from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Link } from "react-router-dom";
import { useLeads } from "../lead/lead.query";
import { useCustomers } from "../customer/customer.query";
import { useProjects } from "../project/project.query";
import { usePayments } from "../payment/payment.query";
import { useOpportunities } from "../opportunity/opportunity.query";

import {
  useCompleteReminder,
  useCreateReminder,
  useDeleteReminder,
  useMyReminders,
  useUpdateReminder,
} from "./reminder.query";
import type { Reminder, ReminderPriority, ReminderStatus, ReminderType } from "./reminder.types";

const PRIORITY_STYLES: Record<ReminderPriority, string> = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700",
};

const STATUS_STYLES: Record<ReminderStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-green-100 text-green-700",
  MISSED: "bg-red-100 text-red-600",
  CANCELLED: "bg-gray-100 text-gray-500",
};

const TYPE_STYLES: Record<ReminderType, string> = {
  LEAD: "bg-violet-100 text-violet-700",
  PROJECT: "bg-blue-100 text-blue-700",
  CUSTOMER: "bg-green-100 text-green-700",
  QUOTATION: "bg-orange-100 text-orange-700",
  TASK: "bg-gray-100 text-gray-600",
  PAYMENT: "bg-teal-100 text-teal-700",
  OPPORTUNITY: "bg-rose-100 text-rose-700",
};

const TYPES: ReminderType[] = ["LEAD", "PROJECT", "CUSTOMER", "QUOTATION", "TASK", "PAYMENT", "OPPORTUNITY"];
const PRIORITIES: ReminderPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const STATUSES: ReminderStatus[] = ["PENDING", "COMPLETED", "MISSED", "CANCELLED"];

function isOverdue(r: Reminder) {
  return r.status === "PENDING" && new Date(r.dueAt) < new Date();
}

function formatDue(dueAt: string, status?: string) {
  const d = new Date(dueAt);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = d.toLocaleDateString([], { day: "numeric", month: "short" });

  if (diffMs < 0) {
    const d2 = Math.floor(-diffMs / (1000 * 60 * 60 * 24));
    const isPending = !status || status === "PENDING";
    return { label: isPending ? (d2 === 0 ? "Overdue today" : `Overdue ${d2}d`) : (dateStr + " " + timeStr), sub: dateStr + " " + timeStr, urgent: isPending };
  }
  if (diffDays === 0) return { label: "Today", sub: timeStr, urgent: true };
  if (diffDays === 1) return { label: "Tomorrow", sub: dateStr + " " + timeStr, urgent: false };
  return { label: `In ${diffDays}d`, sub: dateStr + " " + timeStr, urgent: false };
}

// ─── Schema shared by create & edit ──────────────────────────────────────────
const reminderSchema = z.object({
  title: z.string().min(2, "Title required"),
  description: z.string().optional(),
  type: z.enum(["LEAD", "PROJECT", "CUSTOMER", "QUOTATION", "TASK", "PAYMENT", "OPPORTUNITY"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  dueAt: z.string().min(1, "Due date required"),
  repeatType: z.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY"]).optional(),
  leadId: z.string().optional(),
  customerId: z.string().optional(),
  projectId: z.string().optional(),
  paymentId: z.string().optional(),
  opportunityId: z.string().optional(),
});
type ReminderFormData = z.infer<typeof reminderSchema>;

// ─── Create form ─────────────────────────────────────────────────────────────
function CreateReminderForm({ onSuccess }: { onSuccess: () => void }) {
  const mutation = useCreateReminder();
  const form = useForm<ReminderFormData>({
    resolver: zodResolver(reminderSchema),
    defaultValues: { type: "TASK", priority: "MEDIUM" },
  });

  const submit = async (data: ReminderFormData) => {
    await mutation.mutateAsync({
      ...data,
      dueAt: new Date(data.dueAt).toISOString(),
    });
    form.reset({ type: "TASK", priority: "MEDIUM" });
    onSuccess();
  };

  return <ReminderFormFields form={form} onSubmit={submit} isPending={mutation.isPending} label="Create Reminder" />;
}

// ─── Edit form ────────────────────────────────────────────────────────────────
function EditReminderForm({ reminder, onSuccess }: { reminder: Reminder; onSuccess: () => void }) {
  const mutation = useUpdateReminder();
  const form = useForm<ReminderFormData>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      title: reminder.title,
      description: reminder.description ?? "",
      type: reminder.type,
      priority: reminder.priority,
      dueAt: new Date(reminder.dueAt).toISOString().slice(0, 16),
      repeatType: reminder.repeatType || "NONE",
      leadId: reminder.leadId ?? "",
      customerId: reminder.customerId ?? "",
      projectId: reminder.projectId ?? "",
      paymentId: reminder.paymentId ?? "",
      opportunityId: reminder.opportunityId ?? "",
    },
  });

  useEffect(() => {
    form.reset({
      title: reminder.title,
      description: reminder.description ?? "",
      type: reminder.type,
      priority: reminder.priority,
      dueAt: new Date(reminder.dueAt).toISOString().slice(0, 16),
      repeatType: reminder.repeatType || "NONE",
      leadId: reminder.leadId ?? "",
      customerId: reminder.customerId ?? "",
      projectId: reminder.projectId ?? "",
      paymentId: reminder.paymentId ?? "",
      opportunityId: reminder.opportunityId ?? "",
    });
  }, [reminder.id]);

  const submit = async (data: ReminderFormData) => {
    await mutation.mutateAsync({
      id: reminder.id,
      data: {
        ...data,
        dueAt: new Date(data.dueAt).toISOString(),
      },
    });
    onSuccess();
  };

  return <ReminderFormFields form={form} onSubmit={submit} isPending={mutation.isPending} label="Save Changes" />;
}

// ─── Shared form fields ───────────────────────────────────────────────────────
function ReminderFormFields({
  form,
  onSubmit,
  isPending,
  label,
}: {
  form: ReturnType<typeof useForm<ReminderFormData>>;
  onSubmit: (data: ReminderFormData) => void;
  isPending: boolean;
  label: string;
}) {
  const selectedType = form.watch("type");

  const { data: leadsData } = useLeads(1, "");
  const { data: customersData } = useCustomers(1, "");
  const { data: projectsData } = useProjects(1, "");
  const { data: paymentsData } = usePayments({ page: 1, limit: 100 });
  const { data: opportunitiesData } = useOpportunities(1, "");

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Input placeholder="Title *" {...form.register("title")} />
        {form.formState.errors.title && (
          <p className="text-xs text-red-500 mt-1">{form.formState.errors.title.message}</p>
        )}
      </div>

      <Input placeholder="Description (optional)" {...form.register("description")} />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Type</label>
          <Select
            value={form.watch("type")}
            onValueChange={(v) => {
              form.setValue("type", v as ReminderFormData["type"]);
              form.setValue("leadId", "");
              form.setValue("customerId", "");
              form.setValue("projectId", "");
              form.setValue("paymentId", "");
              form.setValue("opportunityId", "");
            }}
          >
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">Priority</label>
          <Select
            value={form.watch("priority")}
            onValueChange={(v) => form.setValue("priority", v as ReminderFormData["priority"])}
          >
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Due Date & Time *</label>
          <Input type="datetime-local" className="mt-1" {...form.register("dueAt")} />
          {form.formState.errors.dueAt && (
            <p className="text-xs text-red-500 mt-1">{form.formState.errors.dueAt.message}</p>
          )}
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">Repeat Rule</label>
          <Select
            value={form.watch("repeatType") || "NONE"}
            onValueChange={(v) => form.setValue("repeatType", v as any)}
          >
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">None</SelectItem>
              <SelectItem value="DAILY">Daily</SelectItem>
              <SelectItem value="WEEKLY">Weekly</SelectItem>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedType === "LEAD" && (
        <div>
          <label className="text-xs font-medium text-muted-foreground">Select Lead *</label>
          <Select value={form.watch("leadId") || ""} onValueChange={(v) => form.setValue("leadId", v)}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Select Lead" /></SelectTrigger>
            <SelectContent>
              {leadsData?.items.map((l: any) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      {selectedType === "CUSTOMER" && (
        <div>
          <label className="text-xs font-medium text-muted-foreground">Select Customer *</label>
          <Select value={form.watch("customerId") || ""} onValueChange={(v) => form.setValue("customerId", v)}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Select Customer" /></SelectTrigger>
            <SelectContent>
              {customersData?.items.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      {selectedType === "PROJECT" && (
        <div>
          <label className="text-xs font-medium text-muted-foreground">Select Project *</label>
          <Select value={form.watch("projectId") || ""} onValueChange={(v) => form.setValue("projectId", v)}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Select Project" /></SelectTrigger>
            <SelectContent>
              {projectsData?.items.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.projectName}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      {selectedType === "PAYMENT" && (
        <div>
          <label className="text-xs font-medium text-muted-foreground">Select Payment *</label>
          <Select value={form.watch("paymentId") || ""} onValueChange={(v) => form.setValue("paymentId", v)}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Select Payment" /></SelectTrigger>
            <SelectContent>
              {(paymentsData?.data?.items || paymentsData?.items || []).map((p: any) => (
                <SelectItem key={p.id} value={p.id}>{p.billNumber} / {p.project?.projectName || "—"}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {selectedType === "OPPORTUNITY" && (
        <div>
          <label className="text-xs font-medium text-muted-foreground">Select Opportunity *</label>
          <Select value={form.watch("opportunityId") || ""} onValueChange={(v) => form.setValue("opportunityId", v)}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Select Opportunity" /></SelectTrigger>
            <SelectContent>
              {(opportunitiesData?.items || []).map((o: any) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.customer?.name || "No Customer"} - {o.category} ({o.status})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Saving..." : label}
      </Button>
    </form>
  );
}

// ─── Actions menu ─────────────────────────────────────────────────────────────
function ReminderActions({
  reminder,
  onEdit,
  onComplete,
  onDelete,
}: {
  reminder: Reminder;
  onEdit: (r: Reminder) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-1 rounded hover:bg-muted">
          <MoreVertical size={15} className="text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(reminder)}>
          <Pencil size={13} className="mr-2" /> Edit
        </DropdownMenuItem>
        {reminder.status === "PENDING" && (
          <DropdownMenuItem onClick={() => onComplete(reminder.id)} className="text-green-600">
            <Check size={13} className="mr-2" /> Mark Complete
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onDelete(reminder.id)} className="text-red-500">
          <Trash2 size={13} className="mr-2" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Mobile card ──────────────────────────────────────────────────────────────
function LinkedTo({ reminder }: { reminder: Reminder }) {
  if (reminder.lead) {
    return (
      <Link to={`/leads/${reminder.lead.id}`} className="text-xs text-blue-600 hover:underline">
        Lead: {reminder.lead.name}
      </Link>
    );
  }
  if (reminder.customer) {
    return (
      <Link to={`/customers/${reminder.customer.id}`} className="text-xs text-blue-600 hover:underline">
        Customer: {reminder.customer.name}
      </Link>
    );
  }
  if (reminder.project) {
    return (
      <Link to={`/projects/${reminder.project.id}`} className="text-xs text-blue-600 hover:underline">
        Project: {reminder.project.projectName}
      </Link>
    );
  }
  if (reminder.payment) {
    const projName = reminder.payment.project?.projectName || "—";
    return (
      <Link to={`/payments?search=${reminder.payment.billNumber}`} className="text-xs text-blue-600 hover:underline">
        Payment: {reminder.payment.billNumber} / {projName}
      </Link>
    );
  }
  if (reminder.opportunity) {
    return (
      <Link to={`/opportunities/${reminder.opportunity.id}`} className="text-xs text-blue-600 hover:underline">
        Opportunity: {reminder.opportunity.category}
      </Link>
    );
  }
  return <span className="text-xs text-muted-foreground">—</span>;
}

function MobileReminderCard({
  reminder,
  onEdit,
  onComplete,
  onDelete,
}: {
  reminder: Reminder;
  onEdit: (r: Reminder) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const overdue = isOverdue(reminder);
  const due = formatDue(reminder.dueAt, reminder.status);

  return (
    <div className={`bg-white rounded-xl border p-4 space-y-3 ${overdue ? "border-l-4 border-l-red-400" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${reminder.status === "COMPLETED" ? "line-through text-muted-foreground" : ""}`}>
            {reminder.title}
          </p>
          {reminder.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{reminder.description}</p>
          )}
        </div>
        <ReminderActions reminder={reminder} onEdit={onEdit} onComplete={onComplete} onDelete={onDelete} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_STYLES[reminder.type]}`}>
          {reminder.type}
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_STYLES[reminder.priority]}`}>
          {reminder.priority}
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[reminder.status]}`}>
          {reminder.status}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs">
        <LinkedTo reminder={reminder} />
        <span className={`ml-auto font-medium ${due.urgent ? "text-red-500" : "text-muted-foreground"}`}>
          {due.label} · {due.sub}
        </span>
      </div>
    </div>
  );
}

export default function ReminderList() {
  const page = 1;
  const [createOpen, setCreateOpen] = useState(false);
  const [editReminder, setEditReminder] = useState<Reminder | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data, isLoading } = useMyReminders(page, 50);
  const completeMutation = useCompleteReminder();
  const deleteMutation = useDeleteReminder();

  const all = data?.items ?? [];

  // Client-side filter (all reminders are fetched at once)
  const reminders = all.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (priorityFilter !== "all" && r.priority !== priorityFilter) return false;
    if (typeFilter !== "all" && r.type !== typeFilter) return false;
    return true;
  });

  const now = new Date();
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

  const statOverdue = all.filter((r) => r.status === "PENDING" && new Date(r.dueAt) < now).length;
  const statToday = all.filter((r) => r.status === "PENDING" && new Date(r.dueAt) >= now && new Date(r.dueAt) <= todayEnd).length;
  const statPending = all.filter((r) => r.status === "PENDING").length;
  const statCompleted = all.filter((r) => r.status === "COMPLETED").length;

  return (
    <div>
      <PageHeader title="Reminders" />

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", value: all.length, icon: <Bell size={20} className="text-blue-500" />, bg: "bg-blue-50" },
          { label: "Overdue", value: statOverdue, icon: <XCircle size={20} className="text-red-500" />, bg: "bg-red-50" },
          { label: "Due Today", value: statToday, icon: <Clock size={20} className="text-orange-500" />, bg: "bg-orange-50" },
          { label: "Completed", value: statCompleted, icon: <CheckCircle size={20} className="text-green-500" />, bg: "bg-green-50" },
        ].map((c) => (
          <div key={c.label} className={`rounded-xl border p-3 flex items-center gap-3 ${c.bg}`}>
            <div className="shrink-0">{c.icon}</div>
            <div>
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="text-xl font-bold">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-28 text-xs"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-28 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="ml-auto">
          <Button size="sm" onClick={() => setCreateOpen(true)}>+ Create Reminder</Button>
        </div>
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Reminder</DialogTitle></DialogHeader>
          <CreateReminderForm onSuccess={() => setCreateOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editReminder} onOpenChange={(o) => { if (!o) setEditReminder(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Reminder</DialogTitle></DialogHeader>
          {editReminder && (
            <EditReminderForm reminder={editReminder} onSuccess={() => setEditReminder(null)} />
          )}
        </DialogContent>
      </Dialog>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
        ) : reminders.length === 0 ? (
          <div className="text-center py-12">
            <Bell size={36} className="mx-auto text-muted-foreground opacity-30 mb-3" />
            <p className="text-muted-foreground text-sm">No reminders found</p>
          </div>
        ) : (
          reminders.map((r) => (
            <MobileReminderCard
              key={r.id}
              reminder={r}
              onEdit={setEditReminder}
              onComplete={(id) => completeMutation.mutate(id)}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Linked To</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Loading...</TableCell>
              </TableRow>
            ) : reminders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <Bell size={36} className="mx-auto text-muted-foreground opacity-30 mb-2" />
                  <p className="text-muted-foreground text-sm">No reminders found</p>
                </TableCell>
              </TableRow>
            ) : (
              reminders.map((r) => {
                const overdue = isOverdue(r);
                const due = formatDue(r.dueAt, r.status);
                return (
                  <TableRow key={r.id} className={overdue ? "bg-red-50/40" : ""}>
                    <TableCell className="py-3 max-w-xs">
                      <p className={`font-medium text-sm ${r.status === "COMPLETED" ? "line-through text-muted-foreground" : ""}`}>
                        {r.title}
                      </p>
                      {r.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{r.description}</p>
                      )}
                    </TableCell>

                    <TableCell className="py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_STYLES[r.type]}`}>
                        {r.type}
                      </span>
                    </TableCell>

                    <TableCell className="py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_STYLES[r.priority]}`}>
                        {r.priority}
                      </span>
                    </TableCell>

                    <TableCell className="py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[r.status]}`}>
                        {r.status}
                      </span>
                    </TableCell>

                    <TableCell className="py-3">
                      <p className={`text-sm font-medium ${due.urgent ? "text-red-500" : "text-foreground"}`}>
                        {due.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{due.sub}</p>
                    </TableCell>

                    <TableCell className="py-3">
                      <LinkedTo reminder={r} />
                    </TableCell>

                    <TableCell className="py-3">
                      <ReminderActions
                        reminder={r}
                        onEdit={setEditReminder}
                        onComplete={(id) => completeMutation.mutate(id)}
                        onDelete={(id) => deleteMutation.mutate(id)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {statPending > 0 && (
        <p className="text-xs text-muted-foreground mt-3 text-right">
          {statPending} pending reminder{statPending !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
