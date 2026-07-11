import { useState } from "react";
import { toast } from "sonner";
import { Bell, CheckCircle, XCircle, Trash2 } from "lucide-react";

import { Button } from "../../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Textarea } from "../../../components/ui/textarea";
import { useCreateReminder, useCompleteReminder, useUpdateReminder, useDeleteReminder, useMyReminders } from "../../reminder/reminder.query";
import type { ReminderStatus, ReminderPriority } from "../../reminder/reminder.types";

interface Props {
  customerId: string;
}

export default function CustomerReminders({ customerId }: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ReminderStatus>("PENDING");

  const { data: remindersData, isLoading } = useMyReminders(1, 100);
  const createReminderMutation = useCreateReminder();
  const completeReminderMutation = useCompleteReminder();
  const updateReminderMutation = useUpdateReminder();
  const deleteReminderMutation = useDeleteReminder();

  // Create form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<ReminderPriority>("MEDIUM");
  const [dueAt, setDueAt] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueAt) {
      toast.error("Please fill in title and due date");
      return;
    }

    try {
      await createReminderMutation.mutateAsync({
        title,
        description,
        type: "CUSTOMER",
        priority,
        dueAt: new Date(dueAt).toISOString(),
        customerId,
      });
      toast.success("Reminder created successfully");
      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      setDueAt("");
      setCreateOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to create reminder");
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await completeReminderMutation.mutateAsync(id);
      toast.success("Reminder completed");
    } catch (err) {
      console.error(err);
      toast.error("Failed to complete reminder");
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await updateReminderMutation.mutateAsync({
        id,
        data: { status: "CANCELLED" as any },
      });
      toast.success("Reminder cancelled");
    } catch (err) {
      console.error(err);
      toast.error("Failed to cancel reminder");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReminderMutation.mutateAsync(id);
      toast.success("Reminder deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete reminder");
    }
  };

  // Filter items matching the current status filter
  const items = (remindersData?.items ?? []).filter((rem) => {
    if (rem.customerId !== customerId) return false;
    if (statusFilter === "MISSED") {
      return rem.status === "PENDING" && new Date(rem.dueAt) < new Date();
    }
    if (statusFilter === "PENDING") {
      return rem.status === "PENDING" && new Date(rem.dueAt) >= new Date();
    }
    return rem.status === statusFilter;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ReminderStatus)}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Active</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="MISSED">Missed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">{items.length} reminder{items.length !== 1 ? "s" : ""}</span>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">+ Add Reminder</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Reminder</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Title *</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" placeholder="Call client" required />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 text-xs" placeholder="Discuss quote details..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Priority</label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as ReminderPriority)}>
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
                  <Input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="mt-1" required />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createReminderMutation.isPending}>
                {createReminderMutation.isPending ? "Creating..." : "Create Reminder"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground text-center py-6">Loading...</p>
      ) : items.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg border">
          <Bell size={28} className="mx-auto text-muted-foreground opacity-40 mb-2" />
          <p className="text-sm text-muted-foreground">No reminders found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((rem) => {
            const overdue = rem.status === "PENDING" && new Date(rem.dueAt) < new Date();
            const done = rem.status === "COMPLETED" || rem.status === "CANCELLED";
            return (
              <div key={rem.id} className={`rounded-lg border p-3 flex items-start justify-between gap-3 bg-white ${overdue ? "border-red-200 bg-red-50/20" : ""}`}>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${done ? "line-through text-muted-foreground" : "text-gray-900"}`}>{rem.title}</p>
                  {rem.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{rem.description}</p>}
                  <div className="flex flex-wrap gap-2 items-center mt-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${rem.priority === "CRITICAL" ? "bg-red-100 text-red-700" : rem.priority === "HIGH" ? "bg-orange-100 text-orange-700" : rem.priority === "MEDIUM" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                      {rem.priority}
                    </span>
                    <span className={`text-[10px] text-muted-foreground ${overdue ? "text-red-600 font-medium" : ""}`}>
                      {overdue ? "⚠ Overdue · " : ""}
                      {new Date(rem.dueAt).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>

                {!done && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleComplete(rem.id)}>
                      <CheckCircle size={14} className="mr-1" /> Done
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleCancel(rem.id)}>
                      <XCircle size={14} className="mr-1" /> Cancel
                    </Button>
                  </div>
                )}
                {done && (
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0" onClick={() => handleDelete(rem.id)}>
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
