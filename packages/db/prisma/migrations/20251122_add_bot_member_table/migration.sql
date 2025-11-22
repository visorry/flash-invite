-- CreateTable
CREATE TABLE "bot_member" (
    "id" TEXT NOT NULL,
    "telegram_user_id" TEXT NOT NULL,
    "username" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "language_code" TEXT,
    "is_premium" BOOLEAN NOT NULL DEFAULT false,
    "is_bot" BOOLEAN NOT NULL DEFAULT false,
    "last_active_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "bot_member_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bot_member_telegram_user_id_key" ON "bot_member"("telegram_user_id");

-- CreateIndex
CREATE INDEX "bot_member_username_idx" ON "bot_member"("username");

-- CreateIndex
CREATE INDEX "bot_member_last_active_at_idx" ON "bot_member"("last_active_at");
