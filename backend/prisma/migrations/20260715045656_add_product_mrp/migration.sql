-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "mrp" DECIMAL(12,2),
ALTER COLUMN "costPrice" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."QuotationItem" ADD COLUMN     "discountPercent" DECIMAL(5,2),
ADD COLUMN     "mrp" DECIMAL(12,2),
ALTER COLUMN "costPrice" DROP NOT NULL,
ALTER COLUMN "marginPercent" DROP NOT NULL;
