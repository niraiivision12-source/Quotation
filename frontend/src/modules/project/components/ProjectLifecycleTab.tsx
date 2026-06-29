import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Calendar as CalendarIcon,
  CheckCircle,
  TrendingUp,
  History,
  Layers,
  Check,
  FileText,
  Clock,
  Plus,
} from "lucide-react";

import { useUpdateProject, useUpdateProjectPhase } from "../project.query";
import { useUsers } from "@/modules/user/user.query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/axios";
import type { Project } from "../project.types";

interface Props {
  project: Project;
}

const ACTIVITY_ICON: Record<string, React.ReactNode> = {
  CREATED: <Check size={11} />,
  PHASE_CHANGED: <Layers size={11} />,
  STATUS_CHANGED: <CheckCircle size={11} />,
  CLOSED: <CheckCircle size={11} />,
  QUOTATION_CREATED: <FileText size={11} />,
  QUOTATION_EDITED: <FileText size={11} />,
  QUOTATION_SENT: <FileText size={11} />,
  QUOTATION_APPROVED: <Check size={11} />,
  QUOTATION_REJECTED: <span className="text-xs font-bold">✕</span>,
  REMINDER_CREATED: <CalendarIcon size={11} />,
  REMINDER_COMPLETED: <Check size={11} />,
  NOTE_ADDED: <FileText size={11} />,
};

const ACTIVITY_COLOR: Record<string, string> = {
  CREATED: "bg-blue-50 text-blue-600 border-blue-100",
  PHASE_CHANGED: "bg-orange-50 text-orange-500 border-orange-100",
  STATUS_CHANGED: "bg-emerald-50 text-emerald-600 border-emerald-100",
  CLOSED: "bg-red-50 text-red-600 border-red-100",
  QUOTATION_CREATED: "bg-sky-50 text-sky-600 border-sky-100",
  QUOTATION_EDITED: "bg-amber-50 text-amber-600 border-amber-100",
  QUOTATION_SENT: "bg-indigo-50 text-indigo-600 border-indigo-100",
  QUOTATION_APPROVED: "bg-emerald-50 text-emerald-600 border-emerald-100",
  QUOTATION_REJECTED: "bg-red-50 text-red-500 border-red-100",
  REMINDER_CREATED: "bg-violet-50 text-violet-600 border-violet-100",
  REMINDER_COMPLETED: "bg-emerald-50 text-emerald-600 border-emerald-100",
  NOTE_ADDED: "bg-gray-50 text-gray-900 border-gray-150",
};

function getDateLabel(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" });
}

export default function ProjectLifecycleTab({ project }: Props) {
  const qc = useQueryClient();
  const updateProjectMutation = useUpdateProject();
  const updatePhaseMutation = useUpdateProjectPhase();
  const { data: usersData } = useUsers(1);

  const [noteText, setNoteText] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const salesmen = (usersData?.items ?? []).filter((u: any) => u.role === "SALESMAN" && u.isActive);
  const activities = project.activities ?? [];

  const handleStatusChange = async (val: string) => {
    try {
      await updateProjectMutation.mutateAsync({
        id: project.id,
        data: { status: val },
      });
      toast.success("Project status updated");
      qc.invalidateQueries({ queryKey: ["project", project.id] });
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  const handlePhaseChange = async (val: string) => {
    try {
      await updatePhaseMutation.mutateAsync({
        id: project.id,
        phase: val,
      });
      toast.success("Project phase updated");
      qc.invalidateQueries({ queryKey: ["project", project.id] });
    } catch (err) {
      console.error(err);
      toast.error("Failed to update phase");
    }
  };

  const handleSalesmanChange = async (val: string) => {
    try {
      await updateProjectMutation.mutateAsync({
        id: project.id,
        data: { assignedToId: val === "unassigned" ? null : val },
      });
      toast.success("Project salesman updated");
      qc.invalidateQueries({ queryKey: ["project", project.id] });
    } catch (err) {
      console.error(err);
      toast.error("Failed to update salesman");
    }
  };

  const handleStartDateChange = async (val: string) => {
    try {
      await updateProjectMutation.mutateAsync({
        id: project.id,
        data: { startDate: val ? new Date(val).toISOString() : null },
      });
      toast.success("Project start date updated");
      qc.invalidateQueries({ queryKey: ["project", project.id] });
    } catch (err) {
      console.error(err);
      toast.error("Failed to update start date");
    }
  };

  const handleExpectedCompletionChange = async (val: string) => {
    try {
      await updateProjectMutation.mutateAsync({
        id: project.id,
        data: { expectedCompletion: val ? new Date(val).toISOString() : null },
      });
      toast.success("Project expected completion date updated");
      qc.invalidateQueries({ queryKey: ["project", project.id] });
    } catch (err) {
      console.error(err);
      toast.error("Failed to update completion date");
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    setIsSubmittingNote(true);
    try {
      await api.post(`/projects/${project.id}/notes`, { note: noteText });
      toast.success("Note added to timeline");
      setNoteText("");
      qc.invalidateQueries({ queryKey: ["project", project.id] });
    } catch (err) {
      console.error(err);
      toast.error("Failed to add note");
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Group timeline activities by date
  const groups: { label: string; items: any[] }[] = [];
  for (const a of activities) {
    const label = getDateLabel(new Date(a.createdAt));
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(a);
    else groups.push({ label, items: [a] });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 animate-in fade-in duration-200">
      
      {/* Sidebar Controls */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-5 h-fit lg:sticky lg:top-5">
        <div>
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 uppercase tracking-wider">
            <TrendingUp size={14} className="text-violet-600" />
            Progression
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">Manage lifecycle status and key dates.</p>
        </div>

        <div className="space-y-4 text-xs">
          {/* Status Select */}
          <div className="space-y-1">
            <label className="font-semibold text-gray-700 uppercase tracking-wide">Status</label>
            <Select value={project.status} onValueChange={handleStatusChange} disabled={updateProjectMutation.isPending}>
              <SelectTrigger className="w-full text-xs h-8">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="ON_HOLD">On Hold</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CLOSED_WITH_SALE">Closed with Sale</SelectItem>
                <SelectItem value="CLOSED_WITHOUT_SALE">Closed without Sale</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Phase Select */}
          <div className="space-y-1">
            <label className="font-semibold text-gray-700 uppercase tracking-wide">Current Phase</label>
            <Select value={project.currentPhase} onValueChange={handlePhaseChange} disabled={updatePhaseMutation.isPending}>
              <SelectTrigger className="w-full text-xs h-8">
                <SelectValue placeholder="Select Phase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PIPES">Pipes</SelectItem>
                <SelectItem value="WIRING">Wiring</SelectItem>
                <SelectItem value="SWITCHES">Switches</SelectItem>
                <SelectItem value="LIGHTS">Lights</SelectItem>
                <SelectItem value="FANS">Fans</SelectItem>
                <SelectItem value="OTHERS">Others</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assigned Salesman Select */}
          <div className="space-y-1">
            <label className="font-semibold text-gray-700 uppercase tracking-wide">Salesman</label>
            <Select value={project.assignedToId || "unassigned"} onValueChange={handleSalesmanChange} disabled={updateProjectMutation.isPending}>
              <SelectTrigger className="w-full text-xs h-8">
                <SelectValue placeholder="Select Salesman" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {salesmen.map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div className="space-y-1">
            <label className="font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1">
              <CalendarIcon size={12} />
              Started Date
            </label>
            <Input
              type="date"
              className="h-8 text-xs"
              value={project.startDate ? project.startDate.slice(0, 10) : ""}
              onChange={(e) => handleStartDateChange(e.target.value)}
              disabled={updateProjectMutation.isPending}
            />
          </div>

          {/* Expected Completion */}
          <div className="space-y-1">
            <label className="font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1">
              <CalendarIcon size={12} />
              Expected Completion
            </label>
            <Input
              type="date"
              className="h-8 text-xs"
              value={project.expectedCompletion ? project.expectedCompletion.slice(0, 10) : ""}
              onChange={(e) => handleExpectedCompletionChange(e.target.value)}
              disabled={updateProjectMutation.isPending}
            />
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="space-y-6">
        {/* Add Note Form */}
        <form onSubmit={handleAddNote} className="bg-white rounded-2xl border border-gray-150 p-4 shadow-sm space-y-3">
          <p className="text-xs font-bold text-gray-900 uppercase tracking-wide flex items-center gap-1">
            <FileText size={13} className="text-violet-600" /> Add Notes
          </p>
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Type a new timeline note here..."
            className="text-xs min-h-[70px] resize-none"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={isSubmittingNote || !noteText.trim()}
              className="h-8 text-xs bg-violet-600 hover:bg-violet-700 text-white font-medium"
            >
              <Plus size={13} className="mr-1" /> Add Note
            </Button>
          </div>
        </form>

        {/* Chronological Timeline */}
        <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <History size={16} className="text-violet-600" />
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Chronological Timeline</h2>
          </div>

          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                <Clock size={16} className="text-gray-400" />
              </div>
              <p className="text-xs font-medium text-gray-500">No project activity logged yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {groups.map((group) => (
                <div key={group.label}>
                  {/* Date header */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
                    <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                      {group.label}
                    </span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>

                  {/* Group Items */}
                  <div className="space-y-0.5 pl-2">
                    {group.items.map((item, index) => {
                      const icon = ACTIVITY_ICON[item.type] ?? <Clock size={11} />;
                      const color = ACTIVITY_COLOR[item.type] ?? "bg-gray-50 text-gray-500 border-gray-100";

                      return (
                        <div key={item.id} className="flex items-start group relative py-2">
                          {/* Time */}
                          <div className="w-12 shrink-0 pr-3 pt-0.5 text-right">
                            <span className="text-[10px] text-gray-400 tabular-nums">
                              {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>

                          {/* Connector line and dot */}
                          <div className="flex flex-col items-center shrink-0 w-6 mr-3">
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 z-10 ${color}`}>
                              {icon}
                            </div>
                            {index < group.items.length - 1 && (
                              <div className="w-px bg-gray-100 flex-1 my-1" style={{ minHeight: "24px" }} />
                            )}
                          </div>

                          {/* Message Content */}
                          <div className="flex-1 min-w-0 pt-0.5">
                            <p className="text-xs text-gray-900 leading-relaxed font-medium">
                              {item.message}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {item.user?.name ?? "System"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
