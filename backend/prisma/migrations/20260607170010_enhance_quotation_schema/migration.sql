-- CreateEnum
CREATE TYPE "public"."QuotationRevisionReason" AS ENUM ('PRICE_CHANGE', 'PRODUCT_CHANGE', 'CUSTOMER_REQUEST', 'STOCK_CHANGE', 'OTHER');

-- AlterTable
ALTER TABLE "public"."Quotation" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "parentQuotationId" TEXT,
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "revisionReason" "public"."QuotationRevisionReason";

-- CreateIndex
CREATE INDEX "Quotation_parentQuotationId_idx" ON "public"."Quotation"("parentQuotationId");

-- AddForeignKey
ALTER TABLE "public"."Quotation" ADD CONSTRAINT "Quotation_parentQuotationId_fkey" FOREIGN KEY ("parentQuotationId") REFERENCES "public"."Quotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
