-- AlterTable
ALTER TABLE "promoter_config" ADD COLUMN     "additional_bot_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "current_bot_index" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "multiple_bots_enabled" BOOLEAN NOT NULL DEFAULT false;
