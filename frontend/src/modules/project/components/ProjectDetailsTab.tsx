import { useState, useEffect, startTransition } from "react";
import { toast } from "sonner";
import { useUpdateProject, useUpdateProjectPhase } from "../project.query";
import { useUsers } from "../../user/user.query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Input } from "../../../components/ui/input";
import { User, MapPin, Layers, Calendar, Phone, Mail, FolderGit } from "lucide-react";
import type { Project } from "../project.types";

interface Props {
  project: Project;
}

export default function ProjectDetailsTab({ project }: Props) {
  const updateProjectMutation = useUpdateProject();
  const updatePhaseMutation = useUpdateProjectPhase();
  const { data: usersData } = useUsers(1);

  const salesmen = (usersData?.items ?? []).filter((u: any) => u.role === "SALESMAN" && u.isActive);

  const [projectName, setProjectName] = useState(project.projectName);
  const [location, setLocation] = useState(project.location ?? "");

  useEffect(() => {
    startTransition(() => {
      setProjectName(project.projectName);
    });
  }, [project.projectName]);

  useEffect(() => {
    startTransition(() => {
      setLocation(project.location ?? "");
    });
  }, [project.location]);

  const handleNameBlur = async () => {
    if (!projectName.trim() || projectName === project.projectName) return;
    try {
      await updateProjectMutation.mutateAsync({
        id: project.id,
        data: { projectName },
      });
      toast.success("Project name updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update project name");
      setProjectName(project.projectName);
    }
  };

  const handleLocationBlur = async () => {
    if (location === (project.location ?? "")) return;
    try {
      await updateProjectMutation.mutateAsync({
        id: project.id,
        data: { location: location || null },
      });
      toast.success("Project location updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update location");
      setLocation(project.location ?? "");
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

  const createdDate = (project as any).createdAt || project.startDate || new Date().toISOString();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <FolderGit size={16} className="text-violet-600" />
          Project Information
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">Essential project attributes and metadata.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Project Name</label>
          <Input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            onBlur={handleNameBlur}
            disabled={updateProjectMutation.isPending}
            className="w-full font-medium"
            placeholder="Project Name"
          />
        </div>

        {/* Customer (Read-only Card) */}
        <div className="space-y-1.5 md:row-span-2">
          <label className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Customer</label>
          <div className="border border-gray-100 rounded-xl bg-slate-50 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs shrink-0">
                {project.customer.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <span className="font-semibold text-sm text-gray-900">{project.customer.name}</span>
            </div>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              {project.customer.mobile && (
                <div className="flex items-center gap-1.5">
                  <Phone size={12} className="shrink-0 text-gray-500" />
                  <span className="font-medium text-gray-900">{project.customer.mobile}</span>
                </div>
              )}
              {project.customer.email && (
                <div className="flex items-center gap-1.5">
                  <Mail size={12} className="shrink-0 text-gray-500" />
                  <span className="font-medium text-gray-900 truncate">{project.customer.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-1">
            <MapPin size={12} className="text-muted-foreground" />
            Location
          </label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onBlur={handleLocationBlur}
            disabled={updateProjectMutation.isPending}
            className="w-full font-medium"
            placeholder="Project Location"
          />
        </div>

        {/* Assigned Salesman */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-1">
            <User size={12} className="text-muted-foreground" />
            Assigned Salesman
          </label>
          <Select
            value={project.assignedToId || "unassigned"}
            onValueChange={handleSalesmanChange}
            disabled={updateProjectMutation.isPending}
          >
            <SelectTrigger className="w-full font-medium">
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

        {/* Current Phase */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-1">
            <Layers size={12} className="text-muted-foreground" />
            Current Phase
          </label>
          <Select
            value={project.currentPhase}
            onValueChange={handlePhaseChange}
            disabled={updatePhaseMutation.isPending}
          >
            <SelectTrigger className="w-full font-medium">
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

        {/* Created Date */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-1">
            <Calendar size={12} className="text-muted-foreground" />
            Created Date
          </label>
          <Input
            value={new Date(createdDate).toLocaleDateString([], {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            disabled
            className="w-full font-medium bg-slate-50 text-gray-700 cursor-not-allowed border-gray-200"
          />
        </div>
      </div>
    </div>
  );
}
