-- CreateEnum
CREATE TYPE "public"."ProjectPhase" AS ENUM ('PIPES', 'WIRING', 'SWITCHES', 'LIGHTS', 'FANS');

-- CreateTable
CREATE TABLE "public"."Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Project" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "location" TEXT,
    "currentPhase" "public"."ProjectPhase" NOT NULL DEFAULT 'PIPES',
    "estimatedBudget" DECIMAL(12,2),
    "startDate" TIMESTAMP(3),
    "expectedCompletion" TIMESTAMP(3),
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_customerId_idx" ON "public"."Project"("customerId");

-- CreateIndex
CREATE INDEX "Project_currentPhase_idx" ON "public"."Project"("currentPhase");

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
