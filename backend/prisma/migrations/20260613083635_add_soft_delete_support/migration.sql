-- AlterTable
ALTER TABLE "public"."Lead" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "public"."Project" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
