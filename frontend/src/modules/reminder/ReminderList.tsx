import { Bell, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompleteReminder, useDeleteReminder, useMyReminders } from "./reminder.query";
import type { Reminder, ReminderPriority, ReminderStatus } from "./reminder.types";

const PRIORITY_COLORS: Record<ReminderPriority, string> = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-blue-100 text-blue-600",
  HIGH: "bg-orange-100 text-orange-600",
  CRITICAL: "bg-red-100 text-red-600",
};

const STATUS_COLORS: Record<ReminderStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-green-100 text-green-700",
  MISSED: "bg-red-100 text-red-700",
};

function ReminderCard({ reminder }: { reminder: Reminder }) {
  const completeMutation = useCompleteReminder();
  const deleteMutation = useDeleteReminder();

  const dueDate = new Date(reminder.dueAt);
  const isOverdue = reminder.status === "PENDING" && dueDate < new Date();

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${isOverdue ? "border-red-200 bg-red-50/40" : "bg-card"}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-sm font-medium truncate">{reminder.title}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[reminder.priority]}`}>
            {reminder.priority}
          </span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[reminder.status]}`}>
            {reminder.status}
          </span>
        </div>

        {reminder.description && (
          <p className="text-xs text-muted-foreground mb-1">{reminder.description}</p>
        )}

        <p className={`text-xs ${isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
          {isOverdue ? "Overdue · " : "Due · "}
          {dueDate.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
        </p>
      </div>

      <div className="flex gap-1 flex-shrink-0">
        {reminder.status === "PENDING" && (
          <Button
            size="icon-sm"
            variant="ghost"
            className="text-green-600 hover:text-green-700"
            disabled={completeMutation.isPending}
            onClick={() => completeMutation.mutate(reminder.id)}
            title="Mark complete"
          >
            <Check size={15} />
          </Button>
        )}
        <Button
          size="icon-sm"
          variant="ghost"
          className="text-red-400 hover:text-red-600"
          disabled={deleteMutation.isPending}
          onClick={() => deleteMutation.mutate(reminder.id)}
          title="Delete"
        >
          <Trash2 size={15} />
        </Button>
      </div>
    </div>
  );
}

function Section({ title, items }: { title: string; items: Reminder[] }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
        {title} ({items.length})
      </h3>
      {items.map((r) => <ReminderCard key={r.id} reminder={r} />)}
    </div>
  );
}

export default function ReminderList() {
  const { data, isLoading } = useMyReminders();

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading reminders...</p>;

  const all = data?.items ?? [];

  const now = new Date();
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

  const overdue    = all.filter((r) => r.status === "PENDING" && new Date(r.dueAt) < now);
  const today      = all.filter((r) => r.status === "PENDING" && new Date(r.dueAt) >= now && new Date(r.dueAt) <= todayEnd);
  const upcoming   = all.filter((r) => r.status === "PENDING" && new Date(r.dueAt) > todayEnd);
  const completed  = all.filter((r) => r.status === "COMPLETED");
  const missed     = all.filter((r) => r.status === "MISSED");

  if (all.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
        <Bell size={32} className="opacity-30" />
        <p className="text-sm">No reminders yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Section title="Overdue" items={overdue} />
      <Section title="Today" items={today} />
      <Section title="Upcoming" items={upcoming} />
      <Section title="Missed" items={missed} />
      <Section title="Completed" items={completed} />
    </div>
  );
}
