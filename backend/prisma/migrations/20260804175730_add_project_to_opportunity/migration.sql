-- AlterTable
ALTER TABLE "public"."Opportunity" ADD COLUMN     "projectId" TEXT,
ADD COLUMN     "nextPhase" "public"."ProjectPhase";

-- AlterTable
ALTER TABLE "public"."SystemSettings" ALTER COLUMN "quoteNumberFormat" SET DEFAULT 'QTN-{YYYY}-{MM}-{DD}-{NNN}';

-- CreateIndex
CREATE INDEX "Opportunity_projectId_idx" ON "public"."Opportunity"("projectId");

-- AddForeignKey
ALTER TABLE "public"."Opportunity" ADD CONSTRAINT "Opportunity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
