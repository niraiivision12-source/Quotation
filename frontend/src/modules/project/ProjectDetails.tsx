import { ArrowLeft, Calendar, FileText, ListTodo, History, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../../components/ui/button";

import ProjectLifecycle from "./components/ProjectLifecycle";
import ProjectDetailsTab from "./components/ProjectDetailsTab";
import ProjectLifecycleTab from "./components/ProjectLifecycleTab";
import ProjectQuotations from "./components/ProjectQuotations";
import ProjectReminders from "./components/ProjectReminders";
import ProjectTasks from "./components/ProjectTasks";
import ProjectPaymentsTab from "../payment/components/ProjectPaymentsTab";
import { useProject } from "./project.query";
import { CreditCard } from "lucide-react";

type Tab = "details" | "lifecycle" | "phase-tracking" | "quotations" | "reminders" | "payments" | "tasks";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "details", label: "Project Details", icon: <LayoutDashboard size={14} /> },
  { key: "lifecycle", label: "Lifecycle", icon: <History size={14} /> },
  { key: "phase-tracking", label: "Phase Tracking", icon: <ListTodo size={14} /> },
  { key: "quotations", label: "Quotations", icon: <FileText size={14} /> },
  { key: "tasks", label: "Tasks", icon: <ListTodo size={14} /> },
  { key: "reminders", label: "Reminders", icon: <Calendar size={14} /> },
  { key: "payments", label: "Payments", icon: <CreditCard size={14} /> },
];

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useProject(id || "");
  const [activeTab, setActiveTab] = useState<Tab>("details");

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
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
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
      <div className="flex border-b overflow-x-auto shrink-0 scrollbar-none gap-2">
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
        {activeTab === "details" && (
          <ProjectDetailsTab project={data} />
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
        {activeTab === "tasks" && (
          <ProjectTasks projectId={id || ""} />
        )}
        {activeTab === "reminders" && (
          <ProjectReminders projectId={id || ""} customerId={data.customerId} />
        )}
        {activeTab === "payments" && (
          <ProjectPaymentsTab projectId={id || ""} project={data} />
        )}
      </div>
    </div>
  );
}
