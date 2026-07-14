-- CreateEnum
CREATE TYPE "public"."ProjectStatus" AS ENUM ('ACTIVE', 'ON_HOLD', 'COMPLETED', 'CLOSED_WITH_SALE', 'CLOSED_WITHOUT_SALE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PARTIALLY_PAID', 'FULLY_PAID', 'OVERDUE', 'CANCELLED');

-- AlterEnum
ALTER TYPE "public"."ProjectPhase" ADD VALUE 'OTHERS';

-- AlterEnum
ALTER TYPE "public"."ReminderStatus" ADD VALUE 'CANCELLED';

-- AlterEnum
ALTER TYPE "public"."ReminderType" ADD VALUE 'PAYMENT';

-- AlterTable
ALTER TABLE "public"."Customer" ADD COLUMN     "creditAllowed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "defaultCreditDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maxCreditAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00;

-- AlterTable
ALTER TABLE "public"."Project" ADD COLUMN     "status" "public"."ProjectStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "public"."Quotation" ADD COLUMN     "billCreated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "billDate" TIMESTAMP(3),
ADD COLUMN     "billNumber" TEXT;

-- AlterTable
ALTER TABLE "public"."Reminder" ADD COLUMN     "paymentId" TEXT;

-- AlterTable
ALTER TABLE "public"."SystemSettings" ADD COLUMN     "paymentAssignmentMethod" TEXT NOT NULL DEFAULT 'PERCENTAGE',
ADD COLUMN     "paymentAssignmentPercentages" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "paymentDefaultCreditDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "paymentDefaultMethods" JSONB NOT NULL DEFAULT '["CASH","BANK_TRANSFER","UPI","CHEQUE"]',
ADD COLUMN     "paymentDefaultReminderSchedule" JSONB NOT NULL DEFAULT '[0]',
ADD COLUMN     "paymentOverdueGracePeriod" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "paymentReminderFrequency" TEXT NOT NULL DEFAULT 'DAILY';

-- AlterTable
ALTER TABLE "public"."Task" ADD COLUMN     "paymentId" TEXT;

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "salesmanId" TEXT NOT NULL,
    "accountantId" TEXT,
    "collectorId" TEXT NOT NULL,
    "billNumber" TEXT NOT NULL,
    "billDate" TIMESTAMP(3) NOT NULL,
    "totalBillAmount" DECIMAL(12,2) NOT NULL,
    "amountReceived" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "pendingAmount" DECIMAL(12,2) NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "creditPeriod" INTEGER NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PaymentTransaction" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "notes" TEXT,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_quotationId_key" ON "public"."Payment"("quotationId");

-- CreateIndex
CREATE INDEX "Payment_customerId_idx" ON "public"."Payment"("customerId");

-- CreateIndex
CREATE INDEX "Payment_projectId_idx" ON "public"."Payment"("projectId");

-- CreateIndex
CREATE INDEX "Payment_quotationId_idx" ON "public"."Payment"("quotationId");

-- CreateIndex
CREATE INDEX "Payment_salesmanId_idx" ON "public"."Payment"("salesmanId");

-- CreateIndex
CREATE INDEX "Payment_collectorId_idx" ON "public"."Payment"("collectorId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "public"."Payment"("status");

-- CreateIndex
CREATE INDEX "PaymentTransaction_paymentId_idx" ON "public"."PaymentTransaction"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_updatedById_idx" ON "public"."PaymentTransaction"("updatedById");

-- CreateIndex
CREATE INDEX "Task_paymentId_idx" ON "public"."Task"("paymentId");

-- AddForeignKey
ALTER TABLE "public"."Reminder" ADD CONSTRAINT "Reminder_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "public"."Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_salesmanId_fkey" FOREIGN KEY ("salesmanId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_accountantId_fkey" FOREIGN KEY ("accountantId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

