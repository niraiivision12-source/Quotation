import { useState } from "react";
import { toast } from "sonner";
import { Bell, CheckCircle, XCircle, Trash2, Clock } from "lucide-react";

import { Button } from "../../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Textarea } from "../../../components/ui/textarea";
import { useCreateReminder, useCompleteReminder, useUpdateReminder, useDeleteReminder, useMyReminders } from "../../reminder/reminder.query";
import type { ReminderStatus, ReminderPriority } from "../../reminder/reminder.types";

interface Props {
  projectId: string;
  customerId: string;
}

export default function ProjectReminders({ projectId, customerId }: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ReminderStatus>("PENDING");

  const { data: remindersData, isLoading } = useMyReminders(1, 100, projectId);
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
        type: "PROJECT",
        priority,
        dueAt: new Date(dueAt).toISOString(),
        projectId,
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
    if (statusFilter === "MISSED") {
      // A reminder is missed if it is PENDING and dueAt is in the past
      return rem.status === "PENDING" && new Date(rem.dueAt) < new Date();
    }
    if (statusFilter === "PENDING") {
      // A reminder is pending if status is PENDING and dueAt is in the future
      return rem.status === "PENDING" && new Date(rem.dueAt) >= new Date();
    }
    return rem.status === statusFilter;
  });

  const PRIORITY_BADGES: Record<string, string> = {
    LOW: "bg-gray-100 text-gray-600 border-gray-200",
    MEDIUM: "bg-blue-50 text-blue-700 border-blue-100",
    HIGH: "bg-amber-50 text-amber-700 border-amber-100",
    CRITICAL: "bg-red-50 text-red-700 border-red-100",
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header and Controls */}
      <div className="flex justify-between items-center gap-4 flex-wrap">
        {/* Status filtering tabs */}
        <div className="flex bg-slate-50 border p-1 rounded-xl gap-1">
          {(["PENDING", "COMPLETED", "MISSED", "CANCELLED"] as ReminderStatus[]).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                statusFilter === st
                  ? "bg-white text-gray-900 shadow-xs border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {st.charAt(0) + st.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Add Reminder trigger */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white font-medium">
              + Add Reminder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Project Reminder</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-900 uppercase">Title *</label>
                <Input placeholder="Enter title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-900 uppercase">Description</label>
                <Textarea placeholder="Enter description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-900 uppercase">Priority</label>
                  <Select value={priority} onValueChange={(val) => setPriority(val as ReminderPriority)}>
                    <SelectTrigger className="w-full">
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

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-900 uppercase">Due Date & Time *</label>
                  <Input
                    type="datetime-local"
                    value={dueAt}
                    onChange={(e) => setDueAt(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createReminderMutation.isPending} className="bg-violet-600 hover:bg-violet-700 text-white font-medium">
                  {createReminderMutation.isPending ? "Creating..." : "Create Reminder"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reminders List */}
      {isLoading ? (
        <div className="text-center py-8 text-sm text-muted-foreground animate-pulse">Loading reminders...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-100 rounded-2xl p-6">
          <Bell size={36} className="mx-auto text-muted-foreground mb-3 text-slate-300" />
          <p className="text-sm font-semibold text-gray-900">No Reminders found</p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Reminders of status {statusFilter.toLowerCase()} will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((rem) => {
            const isDueOver = new Date(rem.dueAt) < new Date() && rem.status === "PENDING";
            return (
              <div
                key={rem.id}
                className={`bg-white border rounded-2xl p-4 shadow-xs flex justify-between items-start gap-4 hover:border-gray-250 transition-colors ${
                  isDueOver ? "border-red-200 bg-red-50/10" : "border-gray-100"
                }`}
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-gray-900 truncate block">{rem.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 border rounded-full font-medium ${PRIORITY_BADGES[rem.priority]}`}>
                      {rem.priority}
                    </span>
                    {isDueOver && (
                      <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                        Overdue
                      </span>
                    )}
                  </div>

                  {rem.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed">{rem.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-medium">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      Due: {new Date(rem.dueAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                    </span>
                    {rem.completedAt && (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle size={12} />
                        Completed: {new Date(rem.completedAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {rem.status === "PENDING" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 border hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer"
                        onClick={() => handleComplete(rem.id)}
                        disabled={completeReminderMutation.isPending}
                        title="Complete Reminder"
                      >
                        <CheckCircle size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 border hover:bg-red-50 hover:text-red-700 cursor-pointer"
                        onClick={() => handleCancel(rem.id)}
                        disabled={updateReminderMutation.isPending}
                        title="Cancel Reminder"
                      >
                        <XCircle size={14} />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2 border hover:bg-red-50 text-red-500 hover:text-red-700 cursor-pointer"
                    onClick={() => handleDelete(rem.id)}
                    disabled={deleteReminderMutation.isPending}
                    title="Delete Reminder"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
