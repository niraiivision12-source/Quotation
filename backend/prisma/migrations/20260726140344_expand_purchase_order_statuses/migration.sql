-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."PurchaseOrderStatus" ADD VALUE 'PENDING';
ALTER TYPE "public"."PurchaseOrderStatus" ADD VALUE 'ACKNOWLEDGED';
ALTER TYPE "public"."PurchaseOrderStatus" ADD VALUE 'PARTIALLY_FULFILLED';
ALTER TYPE "public"."PurchaseOrderStatus" ADD VALUE 'COMPLETED';
ALTER TYPE "public"."PurchaseOrderStatus" ADD VALUE 'CANCELLED';
