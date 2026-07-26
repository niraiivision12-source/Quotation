-- AlterEnum
ALTER TYPE "public"."QuotationType" ADD VALUE 'PURCHASE_ORDER';

-- AlterTable
ALTER TABLE "public"."Quotation" ADD COLUMN     "totalGst" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."QuotationItem" ADD COLUMN     "gstPercent" DECIMAL(5,2) NOT NULL DEFAULT 18.00;
