-- AlterTable
ALTER TABLE "public"."Lead" ADD COLUMN     "convertedAt" TIMESTAMP(3),
ADD COLUMN     "estimatedValue" DECIMAL(12,2),
ADD COLUMN     "lastContactedAt" TIMESTAMP(3),
ADD COLUMN     "lostReason" TEXT,
ADD COLUMN     "nextFollowUpAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Lead_nextFollowUpAt_idx" ON "public"."Lead"("nextFollowUpAt");
