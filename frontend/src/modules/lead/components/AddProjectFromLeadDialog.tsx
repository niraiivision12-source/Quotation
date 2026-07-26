import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { FolderPlus, MapPin, Layers } from "lucide-react";
import { useCreateProject } from "../../project/project.query";
import { queryClient } from "../../../lib/query-client";

interface AddProjectFromLeadDialogProps {
  open: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  leadId: string;
  /** Pre-fill the assigned salesperson from the lead */
  defaultAssignedToId?: string | null;
}

const PHASES = [
  { value: "PIPES", label: "Pipes" },
  { value: "WIRING", label: "Wiring" },
  { value: "SWITCHES", label: "Switches" },
  { value: "LIGHTS", label: "Lights" },
  { value: "FANS", label: "Fans" },
  { value: "OTHERS", label: "Others" },
];

export default function AddProjectFromLeadDialog({
  open,
  onClose,
  customerId,
  customerName,
  leadId,
  defaultAssignedToId,
}: AddProjectFromLeadDialogProps) {
  const [projectName, setProjectName] = useState("");
  const [location, setLocation] = useState("");
  const [currentPhase, setCurrentPhase] = useState("PIPES");
  const [estimatedBudget, setEstimatedBudget] = useState("");

  const createProjectMutation = useCreateProject();

  const handleClose = () => {
    setProjectName("");
    setLocation("");
    setCurrentPhase("PIPES");
    setEstimatedBudget("");
    onClose();
  };

  const handleCreate = async () => {
    if (!projectName.trim()) {
      toast.error("Project name is required");
      return;
    }

    try {
      await createProjectMutation.mutateAsync({
        customerId,
        projectName: projectName.trim(),
        location: location.trim() || undefined,
        currentPhase,
        estimatedBudget: estimatedBudget ? Number(estimatedBudget) : undefined,
        assignedToId: defaultAssignedToId || undefined,
      });

      // Invalidate lead projects to refresh the list immediately
      queryClient.invalidateQueries({ queryKey: ["lead-projects", leadId] });

      toast.success(`Project "${projectName.trim()}" created and linked to ${customerName}!`);
      handleClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create project");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-800">
            <FolderPlus className="text-blue-600" size={20} />
            Add New Project
          </DialogTitle>
        </DialogHeader>

        <div className="py-2 space-y-4 text-sm">
          {/* Customer info banner */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3.5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
              {customerName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Linked Customer</p>
              <p className="font-semibold text-slate-800">{customerName}</p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Project Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Project Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. Home Renovation, Office Wiring"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="h-9"
                autoFocus
              />
            </div>

            {/* Location */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1">
                <MapPin size={11} /> Location (Optional)
              </label>
              <Input
                placeholder="e.g. Andheri West, Mumbai"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-9"
              />
            </div>

            {/* Current Phase */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1">
                <Layers size={11} /> Starting Phase
              </label>
              <select
                value={currentPhase}
                onChange={(e) => setCurrentPhase(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white shadow-sm focus:border-blue-600 focus:outline-none"
              >
                {PHASES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Estimated Budget */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Estimated Budget (₹) — Optional
              </label>
              <Input
                type="number"
                placeholder="e.g. 150000"
                value={estimatedBudget}
                onChange={(e) => setEstimatedBudget(e.target.value)}
                className="h-9"
                min={0}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={createProjectMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={createProjectMutation.isPending || !projectName.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {createProjectMutation.isPending ? "Creating..." : "Create Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
