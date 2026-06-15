import { Card, CardContent } from "@/components/ui/card";

interface Props {
  projects: {
    id: string;
    projectName: string;
  }[];
}

export default function CustomerProjects({ projects }: Props) {
  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="mb-4">Projects</h2>

        {projects.map((project) => (
          <div key={project.id}>{project.projectName}</div>
        ))}
      </CardContent>
    </Card>
  );
}
