-- CreateEnum
CREATE TYPE "public"."LifecycleStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- CreateTable
CREATE TABLE "public"."ProjectPhaseTracking" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "phase" "public"."ProjectPhase" NOT NULL,
    "status" "public"."LifecycleStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectPhaseTracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectPhaseTracking_projectId_idx" ON "public"."ProjectPhaseTracking"("projectId");

-- CreateIndex
CREATE INDEX "ProjectPhaseTracking_phase_idx" ON "public"."ProjectPhaseTracking"("phase");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectPhaseTracking_projectId_phase_key" ON "public"."ProjectPhaseTracking"("projectId", "phase");

-- AddForeignKey
ALTER TABLE "public"."ProjectPhaseTracking" ADD CONSTRAINT "ProjectPhaseTracking_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
