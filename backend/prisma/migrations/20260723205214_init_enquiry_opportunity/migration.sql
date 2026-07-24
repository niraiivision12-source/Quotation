-- CreateEnum
CREATE TYPE "public"."ProductCategory" AS ENUM ('PIPES', 'WIRES', 'SWITCHES', 'LIGHTS', 'FANS', 'OTHERS');

-- CreateEnum
CREATE TYPE "public"."EnquiryStatus" AS ENUM ('PENDING', 'TRIAGED', 'IGNORED');

-- CreateEnum
CREATE TYPE "public"."OpportunityStatus" AS ENUM ('NEW', 'CONTACTED', 'QUOTATION_SENT', 'NEGOTIATION', 'WON', 'LOST');

-- AlterEnum
ALTER TYPE "public"."ReminderType" ADD VALUE 'OPPORTUNITY';

-- DropIndex
DROP INDEX "public"."Product_name_trgm_idx";

-- DropIndex
DROP INDEX "public"."Product_searchable_idx";

-- DropIndex
DROP INDEX "public"."Product_sku_trgm_idx";

-- AlterTable
ALTER TABLE "public"."Payment" ADD COLUMN     "opportunityId" TEXT;

-- AlterTable
ALTER TABLE "public"."Quotation" ADD COLUMN     "opportunityId" TEXT;

-- AlterTable
ALTER TABLE "public"."Reminder" ADD COLUMN     "opportunityId" TEXT;

-- AlterTable
ALTER TABLE "public"."SystemSettings" ADD COLUMN     "categorySalesmanAssignment" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "public"."Task" ADD COLUMN     "opportunityId" TEXT;

-- CreateTable
CREATE TABLE "public"."Enquiry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "source" TEXT NOT NULL,
    "message" TEXT,
    "status" "public"."EnquiryStatus" NOT NULL DEFAULT 'PENDING',
    "category" "public"."ProductCategory",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Opportunity" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "category" "public"."ProductCategory" NOT NULL,
    "status" "public"."OpportunityStatus" NOT NULL DEFAULT 'NEW',
    "assignedToId" TEXT,
    "estimatedValue" DECIMAL(12,2),
    "source" TEXT,
    "lostReason" TEXT,
    "nextFollowUpAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OpportunityActivity" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpportunityActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Enquiry_mobile_idx" ON "public"."Enquiry"("mobile");

-- CreateIndex
CREATE INDEX "Enquiry_status_idx" ON "public"."Enquiry"("status");

-- CreateIndex
CREATE INDEX "Enquiry_createdAt_idx" ON "public"."Enquiry"("createdAt");

-- CreateIndex
CREATE INDEX "Opportunity_customerId_idx" ON "public"."Opportunity"("customerId");

-- CreateIndex
CREATE INDEX "Opportunity_status_idx" ON "public"."Opportunity"("status");

-- CreateIndex
CREATE INDEX "Opportunity_category_idx" ON "public"."Opportunity"("category");

-- CreateIndex
CREATE INDEX "Opportunity_assignedToId_idx" ON "public"."Opportunity"("assignedToId");

-- CreateIndex
CREATE INDEX "Opportunity_createdAt_idx" ON "public"."Opportunity"("createdAt");

-- CreateIndex
CREATE INDEX "OpportunityActivity_opportunityId_idx" ON "public"."OpportunityActivity"("opportunityId");

-- CreateIndex
CREATE INDEX "OpportunityActivity_userId_idx" ON "public"."OpportunityActivity"("userId");

-- CreateIndex
CREATE INDEX "OpportunityActivity_createdAt_idx" ON "public"."OpportunityActivity"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."Reminder" ADD CONSTRAINT "Reminder_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "public"."Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "public"."Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Quotation" ADD CONSTRAINT "Quotation_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "public"."Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "public"."Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Opportunity" ADD CONSTRAINT "Opportunity_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Opportunity" ADD CONSTRAINT "Opportunity_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OpportunityActivity" ADD CONSTRAINT "OpportunityActivity_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "public"."Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OpportunityActivity" ADD CONSTRAINT "OpportunityActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
