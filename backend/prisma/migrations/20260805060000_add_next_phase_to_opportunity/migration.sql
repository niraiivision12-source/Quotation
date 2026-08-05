-- AlterEnum
BEGIN;
CREATE TYPE "public"."OpportunityStatus_new" AS ENUM ('NEW', 'CONTACTED', 'QUOTATION_SENT', 'NEGOTIATION', 'WON', 'LOST');
ALTER TABLE "public"."Opportunity" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."Opportunity" ALTER COLUMN "status" TYPE "public"."OpportunityStatus_new" USING ("status"::text::"public"."OpportunityStatus_new");
ALTER TYPE "public"."OpportunityStatus" RENAME TO "OpportunityStatus_old";
ALTER TYPE "public"."OpportunityStatus_new" RENAME TO "OpportunityStatus";
DROP TYPE "public"."OpportunityStatus_old";
ALTER TABLE "public"."Opportunity" ALTER COLUMN "status" SET DEFAULT 'NEW';
COMMIT;

-- AlterTable
ALTER TABLE "public"."Opportunity" ADD COLUMN     "nextPhase" "public"."ProjectPhase";
