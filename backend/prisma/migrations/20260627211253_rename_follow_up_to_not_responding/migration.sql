-- AlterTable
ALTER TYPE "LeadStatus" RENAME TO "LeadStatus_old";
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'NOT_RESPONDING', 'QUOTATION_SENT', 'NEGOTIATION', 'WON', 'LOST');
ALTER TABLE "Lead" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Lead" ALTER COLUMN "status" TYPE "LeadStatus" USING (
  CASE 
    WHEN "status"::text = 'FOLLOW_UP' THEN 'NOT_RESPONDING'::"LeadStatus" 
    ELSE "status"::text::"LeadStatus" 
  END
);
ALTER TABLE "Lead" ALTER COLUMN "status" SET DEFAULT 'NEW';
DROP TYPE "LeadStatus_old";
