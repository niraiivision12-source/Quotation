/*
  Warnings:

  - You are about to drop the `LeadQuotation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LeadQuotationItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."LeadQuotation" DROP CONSTRAINT "LeadQuotation_leadId_fkey";

-- DropForeignKey
ALTER TABLE "public"."LeadQuotationItem" DROP CONSTRAINT "LeadQuotationItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "public"."LeadQuotationItem" DROP CONSTRAINT "LeadQuotationItem_quotationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Quotation" DROP CONSTRAINT "Quotation_customerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Quotation" DROP CONSTRAINT "Quotation_projectId_fkey";

-- AlterTable
ALTER TABLE "public"."Quotation" ADD COLUMN     "leadId" TEXT,
ADD COLUMN     "sentAt" TIMESTAMP(3),
ALTER COLUMN "customerId" DROP NOT NULL,
ALTER COLUMN "projectId" DROP NOT NULL,
ALTER COLUMN "phase" DROP NOT NULL,
ALTER COLUMN "version" SET DEFAULT 1;

-- DropTable
DROP TABLE "public"."LeadQuotation";

-- DropTable
DROP TABLE "public"."LeadQuotationItem";

-- CreateIndex
CREATE INDEX "Quotation_leadId_idx" ON "public"."Quotation"("leadId");

-- AddForeignKey
ALTER TABLE "public"."Quotation" ADD CONSTRAINT "Quotation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Quotation" ADD CONSTRAINT "Quotation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Quotation" ADD CONSTRAINT "Quotation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
