import { useParams } from "react-router-dom";

import PageHeader from "@/components/ui/PageHeader";

import { useProject } from "./project.query";

import ProjectOverview from "./components/ProjectOverview";

import ProjectLifecycle from "./components/ProjectLifecycle";
import ProjectQuotations from "./components/ProjectQuotations";
import ProjectReminders from "./components/ProjectReminders";
import ProjectTasks from "./components/ProjectTasks";

export default function ProjectDetails() {
  const { id } = useParams();

  const { data } = useProject(id || "");

  if (!data) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <PageHeader title={data.projectName} />

      <ProjectOverview project={data} />

      <ProjectLifecycle phases={data.phaseTracking} projectId={id || ""} />

      <ProjectQuotations />

      <ProjectReminders />

      <ProjectTasks />
    </div>
  );
}
