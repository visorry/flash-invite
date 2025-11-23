/*
  Warnings:

  - Added the required column `bot_id` to the `broadcast` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "broadcast" ADD COLUMN     "bot_id" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "broadcast_bot_id_idx" ON "broadcast"("bot_id");

-- AddForeignKey
ALTER TABLE "broadcast" ADD CONSTRAINT "broadcast_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
