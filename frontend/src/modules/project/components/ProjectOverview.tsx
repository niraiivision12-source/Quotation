import { Card, CardContent } from "@/components/ui/Card";

interface Props {
  project: {
    location?: string;

    customer: {
      name: string;
    };
  };
}

export default function ProjectOverview({ project }: Props) {
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div>Customer: {project.customer.name}</div>

        <div>Location: {project.location || "-"}</div>
      </CardContent>
    </Card>
  );
}
