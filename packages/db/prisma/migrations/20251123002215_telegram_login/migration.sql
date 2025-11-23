/*
  Warnings:

  - A unique constraint covering the columns `[telegram_id]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "user" ADD COLUMN     "telegram_id" TEXT,
ADD COLUMN     "telegram_username" TEXT;

-- CreateTable
CREATE TABLE "telegram_login_token" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "telegram_user_id" TEXT,
    "username" TEXT,
    "full_name" TEXT,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telegram_login_token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "telegram_login_token_token_key" ON "telegram_login_token"("token");

-- CreateIndex
CREATE INDEX "telegram_login_token_token_idx" ON "telegram_login_token"("token");

-- CreateIndex
CREATE INDEX "telegram_login_token_expires_at_idx" ON "telegram_login_token"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_telegram_id_key" ON "user"("telegram_id");
