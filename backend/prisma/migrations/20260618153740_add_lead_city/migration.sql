-- CreateEnum
CREATE TYPE "public"."LeadActivityType" AS ENUM ('CREATED', 'STATUS_CHANGED', 'FOLLOW_UP_SET', 'FOLLOW_UP_COMPLETED', 'NOTE_ADDED', 'LOST', 'REOPENED', 'CONVERTED');

-- AlterTable
ALTER TABLE "public"."Lead" ADD COLUMN     "city" TEXT;

-- CreateTable
CREATE TABLE "public"."LeadActivity" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "userId" TEXT,
    "type" "public"."LeadActivityType" NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeadActivity_leadId_idx" ON "public"."LeadActivity"("leadId");

-- CreateIndex
CREATE INDEX "LeadActivity_userId_idx" ON "public"."LeadActivity"("userId");

-- CreateIndex
CREATE INDEX "LeadActivity_type_idx" ON "public"."LeadActivity"("type");

-- CreateIndex
CREATE INDEX "LeadActivity_createdAt_idx" ON "public"."LeadActivity"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."LeadActivity" ADD CONSTRAINT "LeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeadActivity" ADD CONSTRAINT "LeadActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
