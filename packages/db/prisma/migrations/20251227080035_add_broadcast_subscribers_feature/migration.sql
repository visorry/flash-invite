/*
  Warnings:

  - Added the required column `user_id` to the `broadcast` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "bot_member" ADD COLUMN     "blocked_at" TIMESTAMPTZ(3),
ADD COLUMN     "is_blocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_subscribed" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "subscribed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "broadcast" ADD COLUMN     "blocked_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "copy_mode" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "error_log" JSONB,
ADD COLUMN     "forward_media" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "remove_links" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "scheduled_for" TIMESTAMPTZ(3),
ADD COLUMN     "source_group_id" TEXT,
ADD COLUMN     "source_message_ids" INTEGER[],
ADD COLUMN     "user_id" TEXT NOT NULL,
ADD COLUMN     "watermark_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "watermark_position" TEXT,
ADD COLUMN     "watermark_text" TEXT,
ALTER COLUMN "content" DROP NOT NULL;

-- AlterTable
ALTER TABLE "forward_rule" ADD COLUMN     "copy_mode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "delete_watermark" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "hide_sender_name" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "auto_drop_rule" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "bot_id" TEXT NOT NULL,
    "source_entity_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "command" TEXT NOT NULL DEFAULT '/drop',
    "rate_limit_enabled" BOOLEAN NOT NULL DEFAULT true,
    "rate_limit_count" INTEGER NOT NULL DEFAULT 5,
    "rate_limit_window" INTEGER NOT NULL DEFAULT 60,
    "rate_limit_window_unit" INTEGER NOT NULL DEFAULT 0,
    "rate_limit_message" TEXT,
    "posts_per_drop" INTEGER NOT NULL DEFAULT 1,
    "random_order" BOOLEAN NOT NULL DEFAULT false,
    "start_from_message_id" INTEGER,
    "end_at_message_id" INTEGER,
    "delete_after_enabled" BOOLEAN NOT NULL DEFAULT false,
    "delete_interval" INTEGER,
    "delete_interval_unit" INTEGER,
    "forward_media" BOOLEAN NOT NULL DEFAULT true,
    "forward_text" BOOLEAN NOT NULL DEFAULT true,
    "forward_documents" BOOLEAN NOT NULL DEFAULT true,
    "forward_stickers" BOOLEAN NOT NULL DEFAULT false,
    "forward_polls" BOOLEAN NOT NULL DEFAULT true,
    "remove_links" BOOLEAN NOT NULL DEFAULT false,
    "add_watermark" TEXT,
    "delete_watermark" BOOLEAN NOT NULL DEFAULT true,
    "hide_sender_name" BOOLEAN NOT NULL DEFAULT false,
    "copy_mode" BOOLEAN NOT NULL DEFAULT false,
    "include_keywords" TEXT[],
    "exclude_keywords" TEXT[],
    "total_drops" INTEGER NOT NULL DEFAULT 0,
    "last_drop_at" TIMESTAMPTZ(3),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "auto_drop_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auto_drop_user_rate_limit" (
    "id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "telegram_user_id" TEXT NOT NULL,
    "request_count" INTEGER NOT NULL DEFAULT 0,
    "window_start" TIMESTAMPTZ(3) NOT NULL,
    "last_message_id" INTEGER,

    CONSTRAINT "auto_drop_user_rate_limit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auto_drop_rule_user_id_idx" ON "auto_drop_rule"("user_id");

-- CreateIndex
CREATE INDEX "auto_drop_rule_bot_id_idx" ON "auto_drop_rule"("bot_id");

-- CreateIndex
CREATE INDEX "auto_drop_rule_source_entity_id_idx" ON "auto_drop_rule"("source_entity_id");

-- CreateIndex
CREATE INDEX "auto_drop_rule_is_active_idx" ON "auto_drop_rule"("is_active");

-- CreateIndex
CREATE INDEX "auto_drop_rule_command_idx" ON "auto_drop_rule"("command");

-- CreateIndex
CREATE UNIQUE INDEX "auto_drop_rule_bot_id_command_key" ON "auto_drop_rule"("bot_id", "command");

-- CreateIndex
CREATE INDEX "auto_drop_user_rate_limit_rule_id_idx" ON "auto_drop_user_rate_limit"("rule_id");

-- CreateIndex
CREATE INDEX "auto_drop_user_rate_limit_telegram_user_id_idx" ON "auto_drop_user_rate_limit"("telegram_user_id");

-- CreateIndex
CREATE INDEX "auto_drop_user_rate_limit_window_start_idx" ON "auto_drop_user_rate_limit"("window_start");

-- CreateIndex
CREATE UNIQUE INDEX "auto_drop_user_rate_limit_rule_id_telegram_user_id_key" ON "auto_drop_user_rate_limit"("rule_id", "telegram_user_id");

-- CreateIndex
CREATE INDEX "bot_member_is_subscribed_idx" ON "bot_member"("is_subscribed");

-- CreateIndex
CREATE INDEX "bot_member_is_blocked_idx" ON "bot_member"("is_blocked");

-- CreateIndex
CREATE INDEX "broadcast_user_id_idx" ON "broadcast"("user_id");

-- CreateIndex
CREATE INDEX "broadcast_scheduled_for_idx" ON "broadcast"("scheduled_for");

-- AddForeignKey
ALTER TABLE "auto_drop_rule" ADD CONSTRAINT "auto_drop_rule_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auto_drop_rule" ADD CONSTRAINT "auto_drop_rule_source_entity_id_fkey" FOREIGN KEY ("source_entity_id") REFERENCES "telegram_entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auto_drop_user_rate_limit" ADD CONSTRAINT "auto_drop_user_rate_limit_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "auto_drop_rule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
