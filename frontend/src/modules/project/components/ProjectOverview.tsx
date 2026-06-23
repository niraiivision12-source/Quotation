import { MapPin, Phone, User } from "lucide-react";

interface Props {
  project: {
    projectName: string;
    location?: string | null;
    estimatedBudget?: number | null;
    currentPhase: string;
    isCompleted: boolean;
    customer: {
      name: string;
      mobile: string;
      email?: string | null;
    };
  };
}

const PHASE_COLORS: Record<string, string> = {
  PIPES: "bg-orange-100 text-orange-700",
  WIRING: "bg-yellow-100 text-yellow-700",
  SWITCHES: "bg-blue-100 text-blue-700",
  LIGHTS: "bg-violet-100 text-violet-700",
  FANS: "bg-teal-100 text-teal-700",
};

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm shrink-0">
      {initials}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  );
}

export default function ProjectOverview({ project }: Props) {
  return (
    <div className="rounded-xl border bg-white p-5 mb-6">
      <div className="flex items-start gap-4 flex-wrap">
        {/* Customer */}
        <div className="flex items-center gap-3 min-w-48">
          <Avatar name={project.customer.name} />
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Customer</p>
            <p className="text-sm font-semibold">{project.customer.name}</p>
            {project.customer.mobile && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <Phone size={11} />
                {project.customer.mobile}
              </div>
            )}
          </div>
        </div>

        <div className="w-px h-12 bg-border self-center hidden sm:block" />

        {/* Info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4 flex-1">
          <InfoItem
            label="Location"
            value={
              project.location
                ? `📍 ${project.location}`
                : undefined
            }
          />
          <InfoItem
            label="Estimated Budget"
            value={
              project.estimatedBudget
                ? `₹${Number(project.estimatedBudget).toLocaleString()}`
                : undefined
            }
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Current Phase</span>
            <span
              className={`text-xs px-2 py-1 rounded-full font-semibold w-fit ${PHASE_COLORS[project.currentPhase] ?? "bg-gray-100 text-gray-700"}`}
            >
              {project.currentPhase.charAt(0) +
                project.currentPhase.slice(1).toLowerCase()}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Status</span>
            <span
              className={`text-xs px-2 py-1 rounded-full font-semibold w-fit ${project.isCompleted ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}
            >
              {project.isCompleted ? "Completed" : "Active"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
