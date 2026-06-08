export interface UpdatePhaseDTO {
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";

  remarks?: string;
}
