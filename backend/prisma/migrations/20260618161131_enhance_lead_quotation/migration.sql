-- AlterTable
ALTER TABLE "public"."LeadQuotation" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "sentAt" TIMESTAMP(3),
ADD COLUMN     "status" "public"."QuotationStatus" NOT NULL DEFAULT 'DRAFT',
ALTER COLUMN "phase" DROP NOT NULL;
