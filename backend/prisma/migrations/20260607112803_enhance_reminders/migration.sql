-- CreateEnum
CREATE TYPE "public"."ReminderPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."ReminderRepeatType" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "public"."Reminder" ADD COLUMN     "notificationSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priority" "public"."ReminderPriority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "repeatType" "public"."ReminderRepeatType" NOT NULL DEFAULT 'NONE';

-- CreateIndex
CREATE INDEX "Reminder_notificationSent_idx" ON "public"."Reminder"("notificationSent");
