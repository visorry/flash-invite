/*
  Warnings:

  - You are about to drop the column `bot_added` on the `telegram_entity` table. All the data in the column will be lost.
  - You are about to drop the column `bot_added_at` on the `telegram_entity` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[bot_id,telegram_user_id]` on the table `bot_member` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[telegram_id,user_id]` on the table `telegram_entity` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `bot_id` to the `bot_member` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bot_id` to the `invite_link` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "bot_member_telegram_user_id_key";

-- DropIndex
DROP INDEX "telegram_entity_telegram_id_key";

-- AlterTable
ALTER TABLE "bot_member" ADD COLUMN     "bot_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "invite_link" ADD COLUMN     "bot_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "telegram_entity" DROP COLUMN "bot_added",
DROP COLUMN "bot_added_at";

-- CreateTable
CREATE TABLE "bot_cost_config" (
    "id" TEXT NOT NULL,
    "cost_per_bot" INTEGER NOT NULL,
    "free_bots_allowed" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "bot_cost_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "bot_id" TEXT NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "last_health_check" TIMESTAMPTZ(3),
    "error_message" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "bot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_telegram_entity" (
    "id" TEXT NOT NULL,
    "bot_id" TEXT NOT NULL,
    "telegram_entity_id" TEXT NOT NULL,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "admin_permissions" JSONB,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "synced_at" TIMESTAMPTZ(3),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "bot_telegram_entity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bot_bot_id_key" ON "bot"("bot_id");

-- CreateIndex
CREATE INDEX "bot_user_id_idx" ON "bot"("user_id");

-- CreateIndex
CREATE INDEX "bot_status_idx" ON "bot"("status");

-- CreateIndex
CREATE INDEX "bot_is_default_idx" ON "bot"("is_default");

-- CreateIndex
CREATE INDEX "bot_telegram_entity_bot_id_idx" ON "bot_telegram_entity"("bot_id");

-- CreateIndex
CREATE INDEX "bot_telegram_entity_telegram_entity_id_idx" ON "bot_telegram_entity"("telegram_entity_id");

-- CreateIndex
CREATE INDEX "bot_telegram_entity_is_primary_idx" ON "bot_telegram_entity"("is_primary");

-- CreateIndex
CREATE UNIQUE INDEX "bot_telegram_entity_bot_id_telegram_entity_id_key" ON "bot_telegram_entity"("bot_id", "telegram_entity_id");

-- CreateIndex
CREATE INDEX "bot_member_bot_id_idx" ON "bot_member"("bot_id");

-- CreateIndex
CREATE INDEX "bot_member_telegram_user_id_idx" ON "bot_member"("telegram_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "bot_member_bot_id_telegram_user_id_key" ON "bot_member"("bot_id", "telegram_user_id");

-- CreateIndex
CREATE INDEX "invite_link_bot_id_idx" ON "invite_link"("bot_id");

-- CreateIndex
CREATE UNIQUE INDEX "telegram_entity_telegram_id_user_id_key" ON "telegram_entity"("telegram_id", "user_id");

-- AddForeignKey
ALTER TABLE "bot" ADD CONSTRAINT "bot_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_telegram_entity" ADD CONSTRAINT "bot_telegram_entity_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_telegram_entity" ADD CONSTRAINT "bot_telegram_entity_telegram_entity_id_fkey" FOREIGN KEY ("telegram_entity_id") REFERENCES "telegram_entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_link" ADD CONSTRAINT "invite_link_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_member" ADD CONSTRAINT "bot_member_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
