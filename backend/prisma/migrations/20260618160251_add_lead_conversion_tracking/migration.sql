/*
  Warnings:

  - A unique constraint covering the columns `[leadId]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Customer" ADD COLUMN     "leadId" TEXT;

-- AlterTable
ALTER TABLE "public"."Lead" ADD COLUMN     "reopenedCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."ProjectActivity" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectActivity_projectId_idx" ON "public"."ProjectActivity"("projectId");

-- CreateIndex
CREATE INDEX "ProjectActivity_userId_idx" ON "public"."ProjectActivity"("userId");

-- CreateIndex
CREATE INDEX "ProjectActivity_createdAt_idx" ON "public"."ProjectActivity"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_leadId_key" ON "public"."Customer"("leadId");

-- AddForeignKey
ALTER TABLE "public"."Customer" ADD CONSTRAINT "Customer_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectActivity" ADD CONSTRAINT "ProjectActivity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectActivity" ADD CONSTRAINT "ProjectActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
