-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "stockGroupId" TEXT,
ADD COLUMN     "tallyAlterId" INTEGER,
ADD COLUMN     "tallyGuid" TEXT,
ADD COLUMN     "tallyMasterId" TEXT,
ADD COLUMN     "unitId" TEXT;

-- CreateTable
CREATE TABLE "public"."StockGroup" (
    "id" TEXT NOT NULL,
    "tallyMasterId" TEXT NOT NULL,
    "tallyGuid" TEXT,
    "tallyAlterId" INTEGER,
    "name" TEXT NOT NULL,
    "parentName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Unit" (
    "id" TEXT NOT NULL,
    "tallyMasterId" TEXT NOT NULL,
    "tallyGuid" TEXT,
    "tallyAlterId" INTEGER,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StockGroup_tallyMasterId_key" ON "public"."StockGroup"("tallyMasterId");

-- CreateIndex
CREATE UNIQUE INDEX "StockGroup_tallyGuid_key" ON "public"."StockGroup"("tallyGuid");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_tallyMasterId_key" ON "public"."Unit"("tallyMasterId");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_tallyGuid_key" ON "public"."Unit"("tallyGuid");

-- CreateIndex
CREATE UNIQUE INDEX "Product_tallyMasterId_key" ON "public"."Product"("tallyMasterId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_tallyGuid_key" ON "public"."Product"("tallyGuid");

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_stockGroupId_fkey" FOREIGN KEY ("stockGroupId") REFERENCES "public"."StockGroup"("tallyMasterId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "public"."Unit"("tallyMasterId") ON DELETE SET NULL ON UPDATE CASCADE;

