import { Card, CardContent } from "@/components/ui/Card";

interface Props {
  phases: {
    id: string;
    phase: string;
    status: string;
  }[];
}

export default function ProjectLifecycle({ phases }: Props) {
  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="mb-4">Lifecycle</h2>

        {phases.map((phase) => (
          <div key={phase.id} className="mb-2">
            {phase.phase}
            {" - "}
            {phase.status}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
