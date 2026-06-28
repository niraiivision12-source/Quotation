-- CreateEnum
CREATE TYPE "public"."QuotationType" AS ENUM ('LEAD', 'CUSTOMER', 'WALK_IN_CUSTOMER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."LeadActivityType" ADD VALUE 'UPDATED';
ALTER TYPE "public"."LeadActivityType" ADD VALUE 'REMINDER_CREATED';
ALTER TYPE "public"."LeadActivityType" ADD VALUE 'CONTACTED';
ALTER TYPE "public"."LeadActivityType" ADD VALUE 'NEGOTIATION_STARTED';
ALTER TYPE "public"."LeadActivityType" ADD VALUE 'REMINDER_COMPLETED';

-- DropForeignKey
ALTER TABLE "public"."LeadActivity" DROP CONSTRAINT "LeadActivity_userId_fkey";

-- DropIndex
DROP INDEX "public"."Lead_nextFollowUpAt_idx";

-- AlterTable
ALTER TABLE "public"."Customer" ADD COLUMN     "city" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "referralDate" TIMESTAMP(3),
ADD COLUMN     "source" TEXT;

-- AlterTable
ALTER TABLE "public"."Lead" ADD COLUMN     "referralDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."Quotation" ADD COLUMN     "authorizedSignatureSnapshot" TEXT,
ADD COLUMN     "bankAccountNoSnapshot" TEXT,
ADD COLUMN     "bankBranchSnapshot" TEXT,
ADD COLUMN     "bankIfscSnapshot" TEXT,
ADD COLUMN     "bankNameSnapshot" TEXT,
ADD COLUMN     "companyAddressSnapshot" TEXT,
ADD COLUMN     "companyEmailSnapshot" TEXT,
ADD COLUMN     "companyGstSnapshot" TEXT,
ADD COLUMN     "companyLogoSnapshot" TEXT,
ADD COLUMN     "companyNameSnapshot" TEXT,
ADD COLUMN     "companyPhoneSnapshot" TEXT,
ADD COLUMN     "companyWebsiteSnapshot" TEXT,
ADD COLUMN     "footerTextSnapshot" TEXT,
ADD COLUMN     "termsAndConditionsSnapshot" TEXT,
ADD COLUMN     "type" "public"."QuotationType" NOT NULL DEFAULT 'LEAD',
ADD COLUMN     "upiIdSnapshot" TEXT,
ADD COLUMN     "walkInAddress" TEXT,
ADD COLUMN     "walkInEmail" TEXT,
ADD COLUMN     "walkInMobile" TEXT,
ADD COLUMN     "walkInName" TEXT;

-- CreateTable
CREATE TABLE "public"."SystemSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "companyName" TEXT NOT NULL DEFAULT '',
    "companyLogo" TEXT,
    "companyGst" TEXT NOT NULL DEFAULT '',
    "companyAddress" TEXT NOT NULL DEFAULT '',
    "companyPhone" TEXT NOT NULL DEFAULT '',
    "companyEmail" TEXT NOT NULL DEFAULT '',
    "companyWebsite" TEXT NOT NULL DEFAULT '',
    "bankName" TEXT NOT NULL DEFAULT '',
    "bankAccountNo" TEXT NOT NULL DEFAULT '',
    "bankIfsc" TEXT NOT NULL DEFAULT '',
    "bankBranch" TEXT NOT NULL DEFAULT '',
    "upiId" TEXT NOT NULL DEFAULT '',
    "termsAndConditions" TEXT NOT NULL DEFAULT '',
    "authorizedSignature" TEXT,
    "footerText" TEXT NOT NULL DEFAULT '',
    "leadAssignmentMethod" TEXT NOT NULL DEFAULT 'MANUAL',
    "leadSalesmanPercentages" JSONB NOT NULL DEFAULT '{}',
    "lastLeadAssignedUserId" TEXT,
    "projectAssignmentMethod" TEXT NOT NULL DEFAULT 'MANUAL',
    "projectSalesmanPercentages" JSONB NOT NULL DEFAULT '{}',
    "projectPhaseAssignment" JSONB NOT NULL DEFAULT '{}',
    "quoteValidityDays" INTEGER NOT NULL DEFAULT 30,
    "quoteDefaultNotes" TEXT NOT NULL DEFAULT '',
    "quoteDefaultDiscount" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "quoteCurrencySymbol" TEXT NOT NULL DEFAULT '₹',
    "quoteNumberFormat" TEXT NOT NULL DEFAULT 'QTN-{YYYY}-{NNN}',
    "quoteTaxDisplay" TEXT NOT NULL DEFAULT 'GST_BREAKUP',
    "quotePdfHeaderFooter" JSONB NOT NULL DEFAULT '{}',
    "notificationReminderTime" TEXT NOT NULL DEFAULT '09:00',
    "notificationReminderPriority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "notificationBrowserEnabled" BOOLEAN NOT NULL DEFAULT true,
    "notificationEmailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "generalTimezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "generalDateFormat" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
    "generalTheme" TEXT NOT NULL DEFAULT 'light',
    "generalDefaultDashboard" TEXT NOT NULL DEFAULT 'dashboard',
    "rolePermissions" JSONB NOT NULL DEFAULT '{}',
    "pricingDefaultMargin" DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    "pricingAllowMarginOverride" BOOLEAN NOT NULL DEFAULT true,
    "pricingMinMargin" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "pricingMaxDiscount" DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "public"."Lead"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."LeadActivity" ADD CONSTRAINT "LeadActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
