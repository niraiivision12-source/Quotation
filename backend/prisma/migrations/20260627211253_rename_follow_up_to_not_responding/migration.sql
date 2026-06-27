-- AlterTable
ALTER TYPE "LeadStatus" RENAME TO "LeadStatus_old";
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'NOT_RESPONDING', 'QUOTATION_SENT', 'NEGOTIATION', 'WON', 'LOST');
ALTER TABLE "Lead" ALTER COLUMN "status" DROP DEFAULT;
UPDATE "Lead" SET "status" = 'NOT_RESPONDING' WHERE "status"::text = 'FOLLOW_UP';
ALTER TABLE "Lead" ALTER COLUMN "status" TYPE "LeadStatus" USING ("status"::text::"LeadStatus");
ALTER TABLE "Lead" ALTER COLUMN "status" SET DEFAULT 'NEW';
DROP TYPE "LeadStatus_old";
