import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUpdatePhase } from "../project.query";

type PhaseStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";

interface Phase {
  id: string;
  phase: string;
  status: PhaseStatus;
  remarks?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
}

interface Props {
  phases: Phase[];
  projectId: string;
}

const STATUS_ICON: Record<PhaseStatus, string> = {
  COMPLETED:   "✅",
  IN_PROGRESS: "🔄",
  SKIPPED:     "⏭️",
  NOT_STARTED: "🔒",
};

const STATUS_COLOR: Record<PhaseStatus, string> = {
  COMPLETED:   "text-green-600",
  IN_PROGRESS: "text-blue-600",
  SKIPPED:     "text-gray-400",
  NOT_STARTED: "text-gray-400",
};

function PhaseStep({
  phase,
  isLocked,
  projectId,
}: {
  phase: Phase;
  isLocked: boolean;
  projectId: string;
}) {
  const [remarks, setRemarks] = useState(phase.remarks ?? "");
  const mutation = useUpdatePhase(projectId);

  const update = (status: string) => {
    mutation.mutate({ phaseId: phase.id, data: { status, remarks } });
  };

  const isActive = phase.status === "IN_PROGRESS";
  const isDone   = phase.status === "COMPLETED" || phase.status === "SKIPPED";

  return (
    <div className="flex gap-4">
      {/* Left — icon + vertical line */}
      <div className="flex flex-col items-center">
        <div className="text-2xl">{STATUS_ICON[phase.status]}</div>
        <div className="w-px flex-1 bg-gray-200 mt-1" />
      </div>

      {/* Right — content */}
      <div className="pb-8 flex-1">
        <div className="flex items-center gap-3 mb-1">
          <span className="font-semibold text-sm">{phase.phase}</span>
          <span className={`text-xs font-medium ${STATUS_COLOR[phase.status]}`}>
            {phase.status.replace("_", " ")}
          </span>
        </div>

        {phase.startedAt && (
          <p className="text-xs text-gray-400 mb-1">
            Started: {new Date(phase.startedAt).toLocaleDateString()}
          </p>
        )}
        {phase.completedAt && (
          <p className="text-xs text-gray-400 mb-1">
            Completed: {new Date(phase.completedAt).toLocaleDateString()}
          </p>
        )}
        {phase.remarks && isDone && (
          <p className="text-xs text-gray-500 mb-1">Remarks: {phase.remarks}</p>
        )}

        {/* Actions for NOT_STARTED or IN_PROGRESS */}
        {!isDone && !isLocked && (
          <div className="mt-2 space-y-2">
            <textarea
              className="w-full text-sm border rounded p-2 resize-none"
              rows={2}
              placeholder="Remarks (optional)"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
            <div className="flex gap-2">
              {phase.status === "NOT_STARTED" && (
                <Button size="sm" onClick={() => update("IN_PROGRESS")} disabled={mutation.isPending}>
                  Start
                </Button>
              )}
              {isActive && (
                <Button size="sm" onClick={() => update("COMPLETED")} disabled={mutation.isPending}>
                  Complete
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => update("SKIPPED")}
                disabled={mutation.isPending}
              >
                Skip
              </Button>
            </div>
          </div>
        )}

        {isLocked && (
          <p className="text-xs text-gray-400 mt-1">
            Complete the previous phase first
          </p>
        )}
      </div>
    </div>
  );
}

export default function ProjectLifecycle({ phases, projectId }: Props) {
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <h2 className="font-semibold text-lg mb-6">Lifecycle</h2>

        {phases.map((phase, index) => {
          const prevPhase = phases[index - 1];
          const isLocked =
            phase.status === "NOT_STARTED" &&
            !!prevPhase &&
            prevPhase.status !== "COMPLETED" &&
            prevPhase.status !== "SKIPPED";

          return (
            <PhaseStep
              key={phase.id}
              phase={phase}
              isLocked={isLocked}
              projectId={projectId}
            />
          );
        })}
      </CardContent>
    </Card>
  );
}
