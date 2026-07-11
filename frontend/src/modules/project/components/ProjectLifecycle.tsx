import { Check, Lightbulb, SkipForward, Wind, Wrench, Zap, ToggleLeft, Lock } from "lucide-react";
import { useState } from "react";

import { Button } from "../../../components/ui/button";
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

const PHASE_ICON: Record<string, React.ReactNode> = {
  PIPES: <Wrench size={16} />,
  WIRING: <Zap size={16} />,
  SWITCHES: <ToggleLeft size={16} />,
  LIGHTS: <Lightbulb size={16} />,
  FANS: <Wind size={16} />,
  OTHERS: <Wrench size={16} />,
};

const PHASE_BG: Record<string, string> = {
  PIPES: "bg-orange-100 text-orange-600",
  WIRING: "bg-yellow-100 text-yellow-600",
  SWITCHES: "bg-blue-100 text-blue-600",
  LIGHTS: "bg-violet-100 text-violet-600",
  FANS: "bg-teal-100 text-teal-600",
  OTHERS: "bg-gray-100 text-gray-600",
};

const STATUS_BADGE: Record<PhaseStatus, string> = {
  COMPLETED: "bg-green-100 text-green-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  SKIPPED: "bg-gray-100 text-gray-500",
  NOT_STARTED: "bg-gray-100 text-gray-400",
};

function PhaseStep({
  phase,
  isLocked,
  isLast,
  projectId,
}: {
  phase: Phase;
  isLocked: boolean;
  isLast: boolean;
  projectId: string;
}) {
  const [remarks, setRemarks] = useState(phase.remarks ?? "");
  const mutation = useUpdatePhase(projectId);

  const update = (status: string) => {
    mutation.mutate({ phaseId: phase.id, data: { status, remarks } });
  };

  const isDone = phase.status === "COMPLETED" || phase.status === "SKIPPED";
  const isActive = phase.status === "IN_PROGRESS";

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center shrink-0">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center ${
            isDone
              ? "bg-green-500 text-white"
              : isActive
                ? `${PHASE_BG[phase.phase]} ring-4 ring-offset-1 ring-blue-100`
                : isLocked
                  ? "bg-gray-100 text-gray-300"
                  : PHASE_BG[phase.phase]
          }`}
        >
          {isDone ? (
            <Check size={16} />
          ) : isLocked ? (
            <Lock size={14} />
          ) : (
            PHASE_ICON[phase.phase]
          )}
        </div>
        {!isLast && <div className="w-px flex-1 bg-border mt-1 min-h-6" />}
      </div>

      <div className="pb-6 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="font-semibold text-sm">
            {phase.phase.charAt(0) + phase.phase.slice(1).toLowerCase()}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_BADGE[phase.status]}`}
          >
            {phase.status.replace("_", " ")}
          </span>
        </div>

        {phase.startedAt && (
          <p className="text-xs text-muted-foreground">
            Started: {new Date(phase.startedAt).toLocaleDateString()}
          </p>
        )}
        {phase.completedAt && (
          <p className="text-xs text-muted-foreground">
            Completed: {new Date(phase.completedAt).toLocaleDateString()}
          </p>
        )}
        {phase.remarks && isDone && (
          <p className="text-xs text-muted-foreground mt-1">
            Remarks: {phase.remarks}
          </p>
        )}

        {isLocked && (
          <p className="text-xs text-muted-foreground mt-1">
            Complete the previous phase first
          </p>
        )}

        {!isDone && !isLocked && (
          <div className="mt-3 space-y-2">
            <textarea
              className="w-full text-sm border rounded-md p-2 resize-none bg-muted/30 focus:outline-none focus:ring-1 focus:ring-ring"
              rows={2}
              placeholder="Remarks (optional)"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
            <div className="flex gap-2">
              {phase.status === "NOT_STARTED" && (
                <Button
                  size="sm"
                  onClick={() => update("IN_PROGRESS")}
                  disabled={mutation.isPending}
                >
                  Start
                </Button>
              )}
              {isActive && (
                <Button
                  size="sm"
                  onClick={() => update("COMPLETED")}
                  disabled={mutation.isPending}
                >
                  <Check size={13} className="mr-1" />
                  Complete
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => update("SKIPPED")}
                disabled={mutation.isPending}
              >
                <SkipForward size={13} className="mr-1" />
                Skip
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProjectLifecycle({ phases, projectId }: Props) {
  const completed = phases.filter((p) => p.status === "COMPLETED").length;
  const total = phases.length;

  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-semibold text-base">Lifecycle</h2>
        <span className="text-xs text-muted-foreground">
          {completed} / {total} phases completed
        </span>
      </div>

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
            isLast={index === phases.length - 1}
            projectId={projectId}
          />
        );
      })}
    </div>
  );
}
