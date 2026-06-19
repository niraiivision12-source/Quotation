-- CreateTable
CREATE TABLE "public"."LeadNote" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "userId" TEXT,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeadNote_leadId_idx" ON "public"."LeadNote"("leadId");

-- CreateIndex
CREATE INDEX "LeadNote_userId_idx" ON "public"."LeadNote"("userId");

-- CreateIndex
CREATE INDEX "LeadNote_createdAt_idx" ON "public"."LeadNote"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."LeadNote" ADD CONSTRAINT "LeadNote_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeadNote" ADD CONSTRAINT "LeadNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
