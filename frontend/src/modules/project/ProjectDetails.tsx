import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";

import ProjectLifecycle from "./components/ProjectLifecycle";
import ProjectOverview from "./components/ProjectOverview";
import ProjectQuotations from "./components/ProjectQuotations";
import ProjectReminders from "./components/ProjectReminders";
import ProjectTasks from "./components/ProjectTasks";
import { useProject } from "./project.query";

type Tab = "lifecycle" | "quotations" | "reminders" | "tasks";

const TABS: { key: Tab; label: string }[] = [
  { key: "lifecycle", label: "Lifecycle" },
  { key: "quotations", label: "Quotations" },
  { key: "reminders", label: "Reminders" },
  { key: "tasks", label: "Tasks" },
];

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useProject(id || "");
  const [activeTab, setActiveTab] = useState<Tab>("lifecycle");

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Loading...</div>
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
          className="h-8 w-8 p-0"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={16} />
        </Button>
        <div>
          <h1 className="text-xl font-bold">{data.projectName}</h1>
          <p className="text-xs text-muted-foreground">{data.customer.name}</p>
        </div>
      </div>

      {/* Overview card */}
      <ProjectOverview project={data} />

      {/* Tabs */}
      <div className="flex border-b mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.key
                ? "border-violet-600 text-violet-600"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "lifecycle" && (
        <ProjectLifecycle
          phases={data.phaseTracking}
          projectId={id || ""}
        />
      )}
      {activeTab === "quotations" && <ProjectQuotations />}
      {activeTab === "reminders" && <ProjectReminders />}
      {activeTab === "tasks" && <ProjectTasks />}
    </div>
  );
}
