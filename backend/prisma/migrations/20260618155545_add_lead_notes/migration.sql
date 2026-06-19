-- CreateTable
CREATE TABLE "public"."LeadQuotationItem" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "sellingPrice" DECIMAL(12,2) NOT NULL,
    "totalPrice" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "LeadQuotationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LeadQuotation" (
    "id" TEXT NOT NULL,
    "quotationNumber" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "phase" "public"."ProjectPhase" NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadQuotation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeadQuotationItem_quotationId_idx" ON "public"."LeadQuotationItem"("quotationId");

-- CreateIndex
CREATE INDEX "LeadQuotationItem_productId_idx" ON "public"."LeadQuotationItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadQuotation_quotationNumber_key" ON "public"."LeadQuotation"("quotationNumber");

-- CreateIndex
CREATE INDEX "LeadQuotation_leadId_idx" ON "public"."LeadQuotation"("leadId");

-- AddForeignKey
ALTER TABLE "public"."LeadQuotationItem" ADD CONSTRAINT "LeadQuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "public"."LeadQuotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeadQuotationItem" ADD CONSTRAINT "LeadQuotationItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeadQuotation" ADD CONSTRAINT "LeadQuotation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
