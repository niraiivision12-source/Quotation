-- AlterTable
ALTER TABLE "public"."Customer" ADD COLUMN     "assignedToId" TEXT;

-- AlterTable
ALTER TABLE "public"."Project" ADD COLUMN     "assignedToId" TEXT;

-- CreateIndex
CREATE INDEX "Customer_assignedToId_idx" ON "public"."Customer"("assignedToId");

-- CreateIndex
CREATE INDEX "Project_assignedToId_idx" ON "public"."Project"("assignedToId");

-- AddForeignKey
ALTER TABLE "public"."Customer" ADD CONSTRAINT "Customer_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
