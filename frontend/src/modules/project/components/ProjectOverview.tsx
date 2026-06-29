import { Phone, Mail, MapPin } from "lucide-react";

interface Props {
  project: {
    id: string;
    projectName: string;
    location?: string | null;
    estimatedBudget?: number | null;
    currentPhase: string;
    isCompleted: boolean;
    status: string;
    customer: {
      name: string;
      mobile: string;
      email?: string | null;
    };
  };
}

const PHASE_COLORS: Record<string, string> = {
  PIPES: "bg-orange-100 text-orange-700 ring-orange-200",
  WIRING: "bg-yellow-100 text-yellow-700 ring-yellow-200",
  SWITCHES: "bg-blue-100 text-blue-700 ring-blue-200",
  LIGHTS: "bg-violet-100 text-violet-700 ring-violet-200",
  FANS: "bg-teal-100 text-teal-700 ring-teal-200",
  OTHERS: "bg-gray-100 text-gray-700 ring-gray-200",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-blue-50 text-blue-700 ring-blue-200",
  ON_HOLD: "bg-amber-50 text-amber-700 ring-amber-250",
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  CLOSED_WITH_SALE: "bg-green-50 text-green-700 ring-green-200",
  CLOSED_WITHOUT_SALE: "bg-gray-50 text-gray-500 ring-gray-200",
  CANCELLED: "bg-red-50 text-red-700 ring-red-200",
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

function InfoItem({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="text-sm font-medium">{value || "—"}</div>
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
            {project.customer.email && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <Mail size={11} />
                {project.customer.email}
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
              project.location ? (
                <span className="flex items-center gap-1">
                  <MapPin size={13} className="text-muted-foreground" />
                  {project.location}
                </span>
              ) : undefined
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
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ring-1 w-fit mt-1 ${PHASE_COLORS[project.currentPhase] ?? "bg-gray-100 text-gray-700 ring-gray-200"}`}
            >
              {project.currentPhase.charAt(0) +
                project.currentPhase.slice(1).toLowerCase()}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Status</span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ring-1 w-fit mt-1 ${STATUS_COLORS[project.status] ?? "bg-gray-100 text-gray-700 ring-gray-200"}`}
            >
              {project.status.replace(/_/g, " ").charAt(0) +
                project.status.replace(/_/g, " ").slice(1).toLowerCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
