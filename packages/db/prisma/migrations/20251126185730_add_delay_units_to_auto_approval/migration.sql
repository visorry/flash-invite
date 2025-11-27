/*
  Warnings:

  - You are about to drop the column `delay_seconds` on the `auto_approval_rule` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "auto_approval_rule" DROP COLUMN "delay_seconds",
ADD COLUMN     "delay_interval" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "delay_unit" INTEGER NOT NULL DEFAULT 0;
