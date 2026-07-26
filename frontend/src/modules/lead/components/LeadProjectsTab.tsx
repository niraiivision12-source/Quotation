import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
  FolderOpen,
  Plus,
  Building2,
  MapPin,
  Calendar,
  User,
  ChevronRight,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useLeadProjects } from "../lead.query";
import AddProjectFromLeadDialog from "./AddProjectFromLeadDialog";
import type { Lead } from "../lead.types";

interface LeadProjectsTabProps {
  leadId: string;
  lead: Lead;
}

const PHASES_ORDER = ["PIPES", "WIRING", "SWITCHES", "LIGHTS", "FANS", "OTHERS"];

const PHASE_LABELS: Record<string, string> = {
  PIPES: "Pipes",
  WIRING: "Wiring",
  SWITCHES: "Switches",
  LIGHTS: "Lights",
  FANS: "Fans",
  OTHERS: "Others",
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  ON_HOLD: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const LIFECYCLE_ICONS: Record<string, React.ReactNode> = {
  COMPLETED: <CheckCircle2 size={14} className="text-green-600" />,
  IN_PROGRESS: <Clock size={14} className="text-blue-600 animate-pulse" />,
  NOT_STARTED: <Circle size={14} className="text-slate-300" />,
};

function PhaseProgressBar({ phaseTracking, currentPhase }: { phaseTracking: any[]; currentPhase: string }) {
  const trackingMap = new Map(phaseTracking.map((pt) => [pt.phase, pt]));

  return (
    <div className="flex items-center gap-1 mt-2">
      {PHASES_ORDER.map((phase, idx) => {
        const tracking = trackingMap.get(phase);
        const status = tracking?.status || "NOT_STARTED";
        const isActive = phase === currentPhase;

        return (
          <div key={phase} className="flex items-center gap-1 flex-1">
            <div
              title={`${PHASE_LABELS[phase]}: ${status.replace(/_/g, " ")}`}
              className={`
                relative flex-1 h-2 rounded-full transition-all
                ${status === "COMPLETED" ? "bg-green-500" : ""}
                ${status === "IN_PROGRESS" ? "bg-blue-500 animate-pulse" : ""}
                ${status === "NOT_STARTED" ? "bg-slate-200" : ""}
              `}
            >
              {isActive && (
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-blue-700 whitespace-nowrap">
                  {PHASE_LABELS[phase]}
                </span>
              )}
            </div>
            {idx < PHASES_ORDER.length - 1 && (
              <ChevronRight size={10} className="text-slate-300 shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ProjectCard({ project }: { project: any }) {
  const currentPhaseTracking = project.phaseTracking?.find(
    (pt: any) => pt.phase === project.currentPhase
  );

  return (
    <Card className="border border-slate-100 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
              <Building2 size={18} className="text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h4 className="font-bold text-slate-900 text-sm truncate">{project.projectName}</h4>
                <Badge
                  className={`text-[10px] font-bold px-2 py-0.5 ${STATUS_STYLES[project.status] || "bg-slate-100 text-slate-600"}`}
                >
                  {project.status}
                </Badge>
              </div>

              {/* Details row */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1 font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                  <Clock size={10} />
                  {PHASE_LABELS[project.currentPhase] || project.currentPhase}
                </span>

                {currentPhaseTracking?.status && (
                  <span className="flex items-center gap-1">
                    {LIFECYCLE_ICONS[currentPhaseTracking.status]}
                    <span className="capitalize">{currentPhaseTracking.status.replace(/_/g, " ")}</span>
                  </span>
                )}

                {project.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={10} className="text-slate-400" />
                    {project.location}
                  </span>
                )}

                {project.startDate && (
                  <span className="flex items-center gap-1">
                    <Calendar size={10} className="text-slate-400" />
                    Started {new Date(project.startDate).toLocaleDateString()}
                  </span>
                )}

                {project.assignedTo && (
                  <span className="flex items-center gap-1">
                    <User size={10} className="text-slate-400" />
                    {project.assignedTo.name}
                  </span>
                )}
              </div>

              {/* Phase progress bar */}
              {project.phaseTracking && project.phaseTracking.length > 0 && (
                <div className="mt-3">
                  <PhaseProgressBar
                    phaseTracking={project.phaseTracking}
                    currentPhase={project.currentPhase}
                  />
                  <div className="mt-6 flex gap-1 flex-wrap">
                    {PHASES_ORDER.map((phase) => {
                      const tracking = project.phaseTracking?.find((pt: any) => pt.phase === phase);
                      const status = tracking?.status || "NOT_STARTED";
                      return (
                        <span
                          key={phase}
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            status === "COMPLETED"
                              ? "bg-green-100 text-green-700"
                              : status === "IN_PROGRESS"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {PHASE_LABELS[phase]}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Estimated budget */}
              {project.estimatedBudget && (
                <p className="text-xs text-slate-500 mt-2">
                  Budget: <span className="font-bold text-slate-700">₹{Number(project.estimatedBudget).toLocaleString()}</span>
                </p>
              )}

              {/* Latest quotation */}
              {project.quotations && project.quotations.length > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  Latest Quote:{" "}
                  <Link
                    to={`/quotations/${project.quotations[0].id}/history`}
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    {project.quotations[0].quotationNumber}
                  </Link>{" "}
                  <Badge variant="secondary" className="text-[9px]">
                    {project.quotations[0].status}
                  </Badge>
                </p>
              )}
            </div>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[10px] text-slate-400">
              Created {new Date(project.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LeadProjectsTab({ leadId, lead }: LeadProjectsTabProps) {
  const { data, isLoading, isError } = useLeadProjects(leadId);
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);

  const customer = data?.customer;
  const projects = data?.projects ?? [];

  const hasCustomer = !!customer;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border border-slate-100 bg-white rounded-2xl shadow-sm">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
              <FolderOpen size={14} className="text-blue-600" />
              Projects
              {projects.length > 0 && (
                <span className="ml-1 bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {projects.length}
                </span>
              )}
            </CardTitle>

            {hasCustomer && (
              <Button
                size="sm"
                onClick={() => setIsAddProjectOpen(true)}
                className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700"
              >
                <Plus size={12} className="mr-1" /> Add New Project
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {/* Customer info */}
          {hasCustomer ? (
            <div className="flex items-center gap-2 text-xs text-slate-600 mb-4 bg-slate-50 border border-slate-100 rounded-lg p-2.5">
              <Building2 size={12} className="text-slate-400 shrink-0" />
              <span>
                Linked customer:{" "}
                <span className="font-semibold text-slate-800">{customer.name}</span>
                <span className="text-slate-400 ml-1">({customer.mobile})</span>
              </span>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm">
              <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800">No customer linked yet</p>
                <p className="text-amber-700 text-xs mt-0.5">
                  This lead hasn't been converted to a customer. Use the{" "}
                  <strong>Change Status → WON</strong> flow or{" "}
                  <strong>Convert</strong> button to link a customer and create projects.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Projects list */}
      {isLoading && (
        <div className="text-center text-sm text-slate-400 py-8 animate-pulse">
          Loading projects...
        </div>
      )}

      {isError && (
        <div className="text-center text-sm text-red-500 py-8">
          Failed to load projects. Please try again.
        </div>
      )}

      {!isLoading && !isError && hasCustomer && projects.length === 0 && (
        <Card className="border border-dashed border-slate-200 bg-slate-50/50 rounded-2xl">
          <CardContent className="p-10 text-center">
            <FolderOpen size={36} className="text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-500 text-sm">No projects yet</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Create the first project for this customer.
            </p>
            <Button
              size="sm"
              onClick={() => setIsAddProjectOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus size={13} className="mr-1.5" /> Add New Project
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && projects.length > 0 && (
        <div className="space-y-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Add Project Dialog */}
      {hasCustomer && (
        <AddProjectFromLeadDialog
          open={isAddProjectOpen}
          onClose={() => setIsAddProjectOpen(false)}
          customerId={customer!.id}
          customerName={customer!.name}
          leadId={leadId}
          defaultAssignedToId={(lead as any).assignedToId}
        />
      )}
    </div>
  );
}
