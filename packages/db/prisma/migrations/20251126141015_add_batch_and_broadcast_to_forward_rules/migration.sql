/*
  Warnings:

  - You are about to drop the column `interval_minutes` on the `forward_rule` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "forward_rule" DROP COLUMN "interval_minutes",
ADD COLUMN     "batch_size" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "broadcast_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "broadcast_message" TEXT,
ADD COLUMN     "broadcast_parse_mode" TEXT,
ADD COLUMN     "delete_after_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "delete_interval" INTEGER,
ADD COLUMN     "delete_interval_unit" INTEGER,
ADD COLUMN     "post_interval" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "post_interval_unit" INTEGER NOT NULL DEFAULT 0;
