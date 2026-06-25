import { Lightbulb, MapPin, Phone, Star, Wind, Wrench, Zap, ToggleLeft } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { Input } from "@/components/ui/input";
import PageHeader from "@/components/ui/PageHeader";

import { useLeads } from "../lead/lead.query";
import type { Lead } from "../lead/lead.types";
import ProjectQuickDrawer from "./components/ProjectQuickDrawer";
import CreateProjectDialog from "./CreateProjectDialog";
import { useProjects } from "./project.query";
import type { Project } from "./project.types";

const KANBAN_COLUMNS: { phase: string; label: string; headerClass: string; icon: React.ReactNode }[] = [
  { phase: "NEW_LEAD",          label: "New Lead",          headerClass: "bg-pink-100 text-pink-700",     icon: <Star size={14} /> },
  { phase: "PIPES",             label: "Pipes",             headerClass: "bg-orange-100 text-orange-700", icon: <Wrench size={14} /> },
  { phase: "WIRING",            label: "Wiring",            headerClass: "bg-yellow-100 text-yellow-700", icon: <Zap size={14} /> },
  { phase: "SWITCHES",          label: "Switches",          headerClass: "bg-blue-100 text-blue-700",     icon: <ToggleLeft size={14} /> },
  { phase: "LIGHTS",            label: "Lights",            headerClass: "bg-violet-100 text-violet-700", icon: <Lightbulb size={14} /> },
  { phase: "FANS",              label: "Fans",              headerClass: "bg-teal-100 text-teal-700",     icon: <Wind size={14} /> },
  { phase: "COMPLETED",         label: "Closed with Sale",  headerClass: "bg-green-100 text-green-700",   icon: null },
  { phase: "CLOSED_WITHOUT_SALE", label: "Closed without Sale", headerClass: "bg-red-100 text-red-700",  icon: null },
];

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

function KanbanCard({ project, onOpen }: { project: Project; onOpen: (id: string) => void }) {
  const initials = project.projectName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const totalAmount = project.quotations?.reduce((sum, q) => sum + Number(q.totalAmount), 0) ?? 0;

  return (
    <div
      onClick={() => onOpen(project.id)}
      className="bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow space-y-2 cursor-pointer"
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
          {initials}
        </div>
        <span className="font-medium text-sm truncate">{project.projectName}</span>
      </div>
      <p className="text-xs text-muted-foreground truncate">{project.customer.name}</p>
      {project.location && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin size={11} /> {project.location}
        </p>
      )}
      {totalAmount > 0 && (
        <p className="text-xs font-medium text-green-700">
          ₹{totalAmount.toLocaleString()}
        </p>
      )}
    </div>
  );
}

function ProjectKanban({ projects, newLeads, onOpen }: { projects: Project[]; newLeads: Lead[]; onOpen: (id: string) => void }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${KANBAN_COLUMNS.length}, minmax(0, 1fr))` }}>
      {KANBAN_COLUMNS.map(({ phase, label, headerClass, icon }) => {
        const isLeadColumn = phase === "NEW_LEAD";
        const columnProjects = isLeadColumn ? [] : projects.filter((p) => p.currentPhase === phase);
        const count = isLeadColumn ? newLeads.length : columnProjects.length;
        const totalAmount = columnProjects.reduce(
          (sum, p) => sum + (p.quotations?.reduce((s, q) => s + Number(q.totalAmount), 0) ?? 0),
          0,
        );

        return (
          <div key={phase} className="flex flex-col gap-2 min-w-0">
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

            <div className="flex flex-col gap-2 min-h-[60px]">
              {count === 0 ? (
                <div className="border border-dashed rounded-lg h-14 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground/40">No projects</span>
                </div>
              ) : isLeadColumn ? (
                newLeads.map((lead) => <LeadCard key={lead.id} lead={lead} />)
              ) : (
                projects
                  .filter((p) => p.currentPhase === phase)
                  .map((p) => <KanbanCard key={p.id} project={p} onOpen={onOpen} />)
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
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const { data: allData } = useProjects(1, search, 200);
  const { data: leadsData } = useLeads(1, search, { status: "NEW" });

  return (
    <div>
      <PageHeader title="Projects" />

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
        projects={allData?.items ?? []}
        newLeads={leadsData?.items ?? []}
        onOpen={setSelectedProjectId}
      />

      <ProjectQuickDrawer
        projectId={selectedProjectId}
        onClose={() => setSelectedProjectId(null)}
      />
    </div>
  );
}
