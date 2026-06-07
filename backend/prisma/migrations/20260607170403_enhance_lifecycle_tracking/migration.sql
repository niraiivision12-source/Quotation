-- AlterTable
ALTER TABLE "public"."ProjectPhaseTracking" ADD COLUMN     "assignedToId" TEXT,
ADD COLUMN     "estimatedValue" DECIMAL(12,2);

-- CreateIndex
CREATE INDEX "ProjectPhaseTracking_assignedToId_idx" ON "public"."ProjectPhaseTracking"("assignedToId");

-- AddForeignKey
ALTER TABLE "public"."ProjectPhaseTracking" ADD CONSTRAINT "ProjectPhaseTracking_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
