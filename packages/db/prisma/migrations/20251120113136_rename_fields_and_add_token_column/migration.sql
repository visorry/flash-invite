/*
  Warnings:

  - You are about to drop the column `expires_at` on the `group_member` table. All the data in the column will be lost.
  - You are about to drop the column `invite_link` on the `group_member` table. All the data in the column will be lost.
  - You are about to drop the column `expires_at` on the `invite_link` table. All the data in the column will be lost.
  - You are about to drop the column `invite_link` on the `invite_link` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[bot_start_link]` on the table `invite_link` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[token]` on the table `invite_link` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `member_expires_at` to the `group_member` table without a default value. This is not possible if the table is not empty.
  - Added the required column `telegram_invite_link` to the `group_member` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bot_start_link` to the `invite_link` table without a default value. This is not possible if the table is not empty.
  - Added the required column `token` to the `invite_link` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Add new columns with temporary defaults
ALTER TABLE "group_member" 
ADD COLUMN "member_expires_at" TIMESTAMPTZ(3),
ADD COLUMN "telegram_invite_link" TEXT;

ALTER TABLE "invite_link" 
ADD COLUMN "bot_start_link" TEXT,
ADD COLUMN "link_expires_at" TIMESTAMPTZ(3),
ADD COLUMN "token" TEXT;

-- Step 2: Migrate data from old columns to new columns
UPDATE "group_member" SET 
  "member_expires_at" = "expires_at",
  "telegram_invite_link" = "invite_link";

UPDATE "invite_link" SET 
  "bot_start_link" = "invite_link",
  "link_expires_at" = "expires_at",
  "token" = COALESCE(metadata->>'token', md5(random()::text));

-- Step 3: Make new columns NOT NULL
ALTER TABLE "group_member" 
ALTER COLUMN "member_expires_at" SET NOT NULL,
ALTER COLUMN "telegram_invite_link" SET NOT NULL;

ALTER TABLE "invite_link" 
ALTER COLUMN "bot_start_link" SET NOT NULL,
ALTER COLUMN "token" SET NOT NULL;

-- Step 4: Drop old indexes
DROP INDEX IF EXISTS "group_member_expires_at_idx";
DROP INDEX IF EXISTS "invite_link_expires_at_idx";
DROP INDEX IF EXISTS "invite_link_invite_link_key";

-- Step 5: Drop old columns
ALTER TABLE "group_member" 
DROP COLUMN "expires_at",
DROP COLUMN "invite_link";

ALTER TABLE "invite_link" 
DROP COLUMN "expires_at",
DROP COLUMN "invite_link";

-- Step 6: Create new indexes and constraints
CREATE INDEX "group_member_member_expires_at_idx" ON "group_member"("member_expires_at");
CREATE INDEX "group_member_telegram_invite_link_idx" ON "group_member"("telegram_invite_link");

CREATE UNIQUE INDEX "invite_link_bot_start_link_key" ON "invite_link"("bot_start_link");
CREATE UNIQUE INDEX "invite_link_token_key" ON "invite_link"("token");
CREATE INDEX "invite_link_link_expires_at_idx" ON "invite_link"("link_expires_at");
CREATE INDEX "invite_link_token_idx" ON "invite_link"("token");
