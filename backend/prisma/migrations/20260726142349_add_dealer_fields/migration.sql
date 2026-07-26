-- AlterTable
ALTER TABLE "public"."Dealer" ADD COLUMN     "city" TEXT,
ADD COLUMN     "contactPerson" TEXT,
ADD COLUMN     "state" TEXT;

-- AlterTable
ALTER TABLE "public"."PurchaseOrder" ADD COLUMN     "dealerContactPersonSnapshot" TEXT;
