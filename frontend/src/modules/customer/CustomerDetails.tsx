import { useParams } from "react-router-dom";

import PageHeader from "@/components/ui/PageHeader";

import { Card, CardContent } from "@/components/ui/card";

import { useCustomer } from "./customer.query";

export default function CustomerDetails() {
  const { id } = useParams();

  const { data } = useCustomer(id || "");

  if (!data) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <PageHeader title={data.name} />

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div>Mobile: {data.mobile}</div>

          <div>Email: {data.email || "-"}</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h2>Projects</h2>

          {data.projects.map((project) => (
            <div key={project.id}>{project.projectName}</div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
