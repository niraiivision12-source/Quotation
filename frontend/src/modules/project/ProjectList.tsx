import { Lightbulb, MapPin, Phone, Star, Wind, Wrench, Zap, ToggleLeft } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { Input } from "../../components/ui/input";
import PageHeader from "../../components/ui/PageHeader";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";

import { useLeads } from "../lead/lead.query";
import type { Lead } from "../lead/lead.types";
import CreateProjectDialog from "./CreateProjectDialog";
import { useProjects, useUpdateProjectPhase } from "./project.query";
import type { Project } from "./project.types";

const KANBAN_COLUMNS: { phase: string; label: string; headerClass: string; icon: React.ReactNode }[] = [
  { phase: "NEW_LEAD",          label: "New Lead",          headerClass: "bg-pink-100 text-pink-700",     icon: <Star size={14} /> },
  { phase: "PIPES",             label: "Pipes",             headerClass: "bg-orange-100 text-orange-700", icon: <Wrench size={14} /> },
  { phase: "WIRING",            label: "Wiring",            headerClass: "bg-yellow-100 text-yellow-700", icon: <Zap size={14} /> },
  { phase: "SWITCHES",          label: "Switches",          headerClass: "bg-blue-100 text-blue-700",     icon: <ToggleLeft size={14} /> },
  { phase: "LIGHTS",            label: "Lights",            headerClass: "bg-violet-100 text-violet-700", icon: <Lightbulb size={14} /> },
  { phase: "FANS",              label: "Fans",              headerClass: "bg-teal-100 text-teal-700",     icon: <Wind size={14} /> },
  { phase: "OTHERS",            label: "Others",            headerClass: "bg-gray-100 text-gray-700",     icon: <Wrench size={14} /> },
];

const getProjectPipelineValueForPhase = (project: Project, phase: string) => {
  if (!project.quotations || project.quotations.length === 0) return 0;
  
  // Find the latest quotation for this phase with an active status
  const active = project.quotations.find(q =>
    q.phase === phase && ["APPROVED", "SENT", "DRAFT"].includes(q.status)
  );
  return active ? Number(active.totalAmount) : 0;
};

function LeadCard({ lead }: { lead: Lead }) {
  const initials = lead.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <Link to="/leads">
      <div className="bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow space-y-1.5 cursor-pointer">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-xs shrink-0">
            {initials}
          </div>
          <span className="font-medium text-sm truncate">{lead.name}</span>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Phone size={11} /> {lead.mobile}
        </p>
        {lead.city && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin size={11} /> {lead.city}
          </p>
        )}
        {lead.source && (
          <span className="text-xs bg-pink-50 text-pink-600 px-1.5 py-0.5 rounded-full">{lead.source}</span>
        )}
      </div>
    </Link>
  );
}

function KanbanCard({ project, phase }: { project: Project; phase: string }) {
  const initials = project.projectName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const totalAmount = getProjectPipelineValueForPhase(project, phase);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", project.id);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow space-y-2 cursor-grab active:cursor-grabbing"
    >
      <Link to={`/projects/${project.id}`}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
            {initials}
          </div>
          <span className="font-medium text-sm truncate block">{project.projectName}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-1">{project.customer.name}</p>
        {project.location && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin size={11} /> {project.location}
          </p>
        )}
        {totalAmount > 0 && (
          <p className="text-xs font-medium text-green-700 mt-1">
            ₹{totalAmount.toLocaleString()}
          </p>
        )}
      </Link>
    </div>
  );
}

interface ProjectKanbanProps {
  projects: Project[];
  newLeads: Lead[];
  onProjectDrop: (projectId: string, targetPhase: string, targetPhaseLabel: string) => void;
}

function ProjectKanban({ projects, newLeads, onProjectDrop }: ProjectKanbanProps) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${KANBAN_COLUMNS.length}, minmax(0, 1fr))` }}>
      {KANBAN_COLUMNS.map(({ phase, label, headerClass, icon }) => {
        const isLeadColumn = phase === "NEW_LEAD";
        const columnProjects = isLeadColumn ? [] : projects.filter((p) => p.currentPhase === phase);
        const count = isLeadColumn ? newLeads.length : columnProjects.length;
        const totalAmount = isLeadColumn ? 0 : columnProjects.reduce(
          (sum, p) => sum + getProjectPipelineValueForPhase(p, phase),
          0,
        );

        const handleDragOver = (e: React.DragEvent) => {
          if (!isLeadColumn) {
            e.preventDefault();
          }
        };

        const handleDrop = (e: React.DragEvent) => {
          e.preventDefault();
          const projectId = e.dataTransfer.getData("text/plain");
          if (projectId && !isLeadColumn) {
            onProjectDrop(projectId, phase, label);
          }
        };

        return (
          <div
            key={phase}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="flex flex-col gap-2 min-w-0"
          >
            <div className={`rounded-md px-2 py-2 flex flex-col gap-0.5 ${headerClass}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 min-w-0">
                  <span className="shrink-0">{icon}</span>
                  <span className="text-xs font-semibold truncate">{label}</span>
                </div>
                <span className="text-xs font-bold ml-1 shrink-0">{count}</span>
              </div>
              <span className="text-xs font-medium opacity-80">
                ₹{totalAmount.toLocaleString()}
              </span>
            </div>

            <div className="flex flex-col gap-2 min-h-[300px] bg-slate-50/50 rounded-lg p-1 border border-dashed border-slate-200">
              {count === 0 ? (
                <div className="rounded-lg h-14 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground/40">No projects</span>
                </div>
              ) : isLeadColumn ? (
                newLeads.map((lead) => <LeadCard key={lead.id} lead={lead} />)
              ) : (
                columnProjects.map((p) => <KanbanCard key={p.id} project={p} phase={phase} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ProjectList() {
  const [search, setSearch] = useState("");
  const [confirmDrop, setConfirmDrop] = useState<{
    projectId: string;
    projectName: string;
    targetPhase: string;
    targetPhaseLabel: string;
  } | null>(null);

  const { data: allData } = useProjects(1, search, 200);
  const { data: leadsData } = useLeads(1, search, { status: "NEW" });
  const updatePhaseMutation = useUpdateProjectPhase();

  const activeProjects = (allData?.items ?? []).filter(
    (p) => !["COMPLETED", "CLOSED_WITH_SALE", "CLOSED_WITHOUT_SALE", "CANCELLED"].includes(p.status)
  );

  const handleProjectDrop = (projectId: string, targetPhase: string, targetPhaseLabel: string) => {
    const proj = activeProjects.find((p) => p.id === projectId);
    if (!proj) return;
    
    // If phase didn't change, do nothing
    if (proj.currentPhase === targetPhase) return;

    setConfirmDrop({
      projectId,
      projectName: proj.projectName,
      targetPhase,
      targetPhaseLabel,
    });
  };

  const handleConfirmMove = async () => {
    if (!confirmDrop) return;
    try {
      await updatePhaseMutation.mutateAsync({
        id: confirmDrop.projectId,
        phase: confirmDrop.targetPhase,
      });
      toast.success(`Project moved to ${confirmDrop.targetPhaseLabel}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to transition project phase");
    } finally {
      setConfirmDrop(null);
    }
  };

  return (
    <div>
      <PageHeader title="Pipelines" />

      <div className="flex items-center justify-between mb-4 gap-3">
        <Input
          placeholder="Search projects..."
          value={search}
          className="max-w-sm"
          onChange={(e) => setSearch(e.target.value)}
        />
        <CreateProjectDialog />
      </div>

      <ProjectKanban
        projects={activeProjects}
        newLeads={leadsData?.items ?? []}
        onProjectDrop={handleProjectDrop}
      />

      {confirmDrop && (
        <Dialog open={!!confirmDrop} onOpenChange={(o) => !o && setConfirmDrop(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Phase Transition</DialogTitle>
              <DialogDescription>
                Are you sure you want to transition the project <span className="font-semibold text-foreground">"{confirmDrop.projectName}"</span> to the <span className="font-semibold text-foreground">"{confirmDrop.targetPhaseLabel}"</span> phase?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDrop(null)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmMove} disabled={updatePhaseMutation.isPending}>
                {updatePhaseMutation.isPending ? "Transitioning..." : "Confirm & Move"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
