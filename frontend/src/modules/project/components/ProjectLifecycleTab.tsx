import { toast } from "sonner";
import { Calendar, CheckCircle, TrendingUp, History } from "lucide-react";

import { useUpdateProject, useUpdateProjectPhase } from "../project.query";
import { useUsers } from "@/modules/user/user.query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { Project } from "../project.types";

interface Props {
  project: Project;
}

export default function ProjectLifecycleTab({ project }: Props) {
  const updateProjectMutation = useUpdateProject();
  const updatePhaseMutation = useUpdateProjectPhase();
  const { data: usersData } = useUsers(1);

  const salesmen = (usersData?.items ?? []).filter((u: any) => u.role === "SALESMAN" && u.isActive);

  // Group activities for Phase and Status History
  const activities = project.activities ?? [];
  const phaseHistory = activities.filter(
    (a: any) => a.type === "PHASE_CHANGED" || a.type === "PIPELINE_VALUE_MOVED"
  );
  const statusHistory = activities.filter(
    (a: any) => a.type === "STATUS_CHANGED" || a.type === "CLOSED"
  );

  const handleStatusChange = async (val: string) => {
    try {
      await updateProjectMutation.mutateAsync({
        id: project.id,
        data: { status: val },
      });
      toast.success("Project status updated");
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
    } catch (err) {
      console.error(err);
      toast.error("Failed to update completion date");
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Management Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-6">
        <div>
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp size={16} className="text-violet-600" />
            Project Progression
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage the status, phase, assignment, and key dates.</p>
        </div>

        <div className="space-y-4">
          {/* Status Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Current Project Status</label>
            <Select value={project.status} onValueChange={handleStatusChange} disabled={updateProjectMutation.isPending}>
              <SelectTrigger className="w-full">
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
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Current Phase</label>
            <Select value={project.currentPhase} onValueChange={handlePhaseChange} disabled={updatePhaseMutation.isPending}>
              <SelectTrigger className="w-full">
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
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Assigned Salesman</label>
            <Select value={project.assignedToId || "unassigned"} onValueChange={handleSalesmanChange} disabled={updateProjectMutation.isPending}>
              <SelectTrigger className="w-full">
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

          {/* Dates Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-1">
                <Calendar size={12} />
                Started Date
              </label>
              <Input
                type="date"
                value={project.startDate ? project.startDate.slice(0, 10) : ""}
                onChange={(e) => handleStartDateChange(e.target.value)}
                disabled={updateProjectMutation.isPending}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-1">
                <Calendar size={12} />
                Expected Completion
              </label>
              <Input
                type="date"
                value={project.expectedCompletion ? project.expectedCompletion.slice(0, 10) : ""}
                onChange={(e) => handleExpectedCompletionChange(e.target.value)}
                disabled={updateProjectMutation.isPending}
              />
            </div>
          </div>
        </div>
      </div>

      {/* History Card */}
      <div className="space-y-6">
        {/* Phase History */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <History size={16} className="text-blue-600" />
            Phase History
          </h2>
          {phaseHistory.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No phase updates recorded.</p>
          ) : (
            <div className="relative border-l border-slate-100 pl-4 space-y-4 max-h-72 overflow-y-auto">
              {phaseHistory.map((item: any) => (
                <div key={item.id} className="relative">
                  <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border border-blue-500 bg-white" />
                  <p className="text-sm font-medium text-gray-900 leading-tight">{item.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(item.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                    {item.user && ` · by ${item.user.name}`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status History */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <CheckCircle size={16} className="text-emerald-600" />
            Status History
          </h2>
          {statusHistory.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No status transitions recorded.</p>
          ) : (
            <div className="relative border-l border-slate-100 pl-4 space-y-4 max-h-72 overflow-y-auto">
              {statusHistory.map((item: any) => (
                <div key={item.id} className="relative">
                  <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border border-emerald-500 bg-white" />
                  <p className="text-sm font-medium text-gray-900 leading-tight">{item.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(item.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                    {item.user && ` · by ${item.user.name}`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
