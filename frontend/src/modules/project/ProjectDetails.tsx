import { ArrowLeft, Calendar, FileText, ListTodo, History, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

import ProjectLifecycle from "./components/ProjectLifecycle";
import ProjectOverview from "./components/ProjectOverview";
import ProjectLifecycleTab from "./components/ProjectLifecycleTab";
import ProjectQuotations from "./components/ProjectQuotations";
import ProjectReminders from "./components/ProjectReminders";
import ProjectTasks from "./components/ProjectTasks";
import { useProject } from "./project.query";

type Tab = "overview" | "lifecycle" | "phase-tracking" | "quotations" | "reminders" | "timeline" | "tasks";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "overview", label: "Overview", icon: <LayoutDashboard size={14} /> },
  { key: "lifecycle", label: "Lifecycle", icon: <History size={14} /> },
  { key: "phase-tracking", label: "Phase Tracking", icon: <ListTodo size={14} /> },
  { key: "quotations", label: "Quotations", icon: <FileText size={14} /> },
  { key: "reminders", label: "Reminders", icon: <Calendar size={14} /> },
  { key: "timeline", label: "Activities / Timeline", icon: <History size={14} /> },
  { key: "tasks", label: "Tasks", icon: <ListTodo size={14} /> },
];

function getDateLabel(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" });
}

function ProjectTimeline({ activities }: { activities: any[] }) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-gray-100 p-6 animate-in fade-in duration-200">
        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
          <Calendar size={20} className="text-gray-500" />
        </div>
        <p className="text-sm font-medium text-gray-900">No activity yet</p>
        <p className="text-xs text-muted-foreground mt-1">Actions will appear here as they happen</p>
      </div>
    );
  }

  const groups: { label: string; items: any[] }[] = [];
  for (const a of activities) {
    const label = getDateLabel(new Date(a.createdAt));
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(a);
    else groups.push({ label, items: [a] });
  }

  return (
    <div className="space-y-8 bg-white rounded-2xl border border-gray-100 p-6 animate-in fade-in duration-200">
      {groups.map((group) => (
        <div key={group.label}>
          {/* Date header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-2 h-2 rounded-full bg-violet-500 shrink-0" />
            <span className="text-xs font-semibold text-gray-900 tracking-wider uppercase">
              {group.label}
            </span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Items */}
          <div className="space-y-0">
            {group.items.map((a, index) => (
              <div key={a.id} className="flex items-start">
                {/* Time */}
                <div className="w-16 shrink-0 text-right pr-4 pt-1">
                  <span className="text-[11px] text-gray-500 whitespace-nowrap tabular-nums">
                    {new Date(a.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                {/* Connector */}
                <div className="flex flex-col items-center shrink-0 w-6 mr-3">
                  <div className="w-2.5 h-2.5 rounded-full border-2 border-violet-300 bg-white mt-1.5 shrink-0 z-10" />
                  {index < group.items.length - 1 && (
                    <div className="w-px bg-gray-150 flex-1 mt-1" style={{ minHeight: "28px" }} />
                  )}
                </div>

                {/* Content */}
                <div className="flex items-start gap-2.5 pb-4 flex-1 min-w-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900 leading-snug">{a.message}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{a.user?.name ?? "System"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useProject(id || "");
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground animate-pulse">Loading...</div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Project not found.</div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 border"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={16} />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{data.projectName}</h1>
          <p className="text-xs text-muted-foreground">{data.customer.name}</p>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b mb-6 overflow-x-auto shrink-0 scrollbar-none gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? "border-violet-600 text-violet-600 font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-4">
        {activeTab === "overview" && (
          <ProjectOverview project={data} />
        )}
        {activeTab === "lifecycle" && (
          <ProjectLifecycleTab project={data} />
        )}
        {activeTab === "phase-tracking" && (
          <ProjectLifecycle
            phases={data.phaseTracking}
            projectId={id || ""}
          />
        )}
        {activeTab === "quotations" && (
          <ProjectQuotations projectId={id || ""} />
        )}
        {activeTab === "reminders" && (
          <ProjectReminders projectId={id || ""} customerId={data.customerId} />
        )}
        {activeTab === "timeline" && (
          <ProjectTimeline activities={data.activities || []} />
        )}
        {activeTab === "tasks" && (
          <ProjectTasks projectId={id || ""} />
        )}
      </div>
    </div>
  );
}
