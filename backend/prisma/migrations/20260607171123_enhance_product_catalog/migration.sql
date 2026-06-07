/*
  Warnings:

  - You are about to drop the column `lastSyncAt` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Product" DROP COLUMN "lastSyncAt",
ADD COLUMN     "tallyStockQty" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tallyUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "unit" TEXT;

-- CreateTable
CREATE TABLE "public"."ProductMargin" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "role" "public"."UserRole",
    "marginPercent" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductMargin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductMargin_productId_idx" ON "public"."ProductMargin"("productId");

-- CreateIndex
CREATE INDEX "Product_name_idx" ON "public"."Product"("name");

-- CreateIndex
CREATE INDEX "Product_sku_idx" ON "public"."Product"("sku");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "public"."Product"("category");

-- AddForeignKey
ALTER TABLE "public"."ProductMargin" ADD CONSTRAINT "ProductMargin_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
