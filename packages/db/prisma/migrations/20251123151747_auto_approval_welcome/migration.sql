-- CreateTable
CREATE TABLE "auto_approval_rule" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "bot_id" TEXT NOT NULL,
    "telegram_entity_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "approval_mode" INTEGER NOT NULL DEFAULT 0,
    "delay_seconds" INTEGER NOT NULL DEFAULT 0,
    "require_premium" BOOLEAN NOT NULL DEFAULT false,
    "require_username" BOOLEAN NOT NULL DEFAULT false,
    "min_account_age" INTEGER,
    "blocked_countries" TEXT[],
    "send_welcome_msg" BOOLEAN NOT NULL DEFAULT false,
    "welcome_message" TEXT,
    "approved_count" INTEGER NOT NULL DEFAULT 0,
    "rejected_count" INTEGER NOT NULL DEFAULT 0,
    "last_approved_at" TIMESTAMPTZ(3),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "auto_approval_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "welcome_config" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "bot_id" TEXT NOT NULL,
    "telegram_entity_id" TEXT NOT NULL,
    "welcome_enabled" BOOLEAN NOT NULL DEFAULT false,
    "welcome_message" TEXT,
    "welcome_parse_mode" TEXT,
    "welcome_buttons" JSONB,
    "goodbye_enabled" BOOLEAN NOT NULL DEFAULT false,
    "goodbye_message" TEXT,
    "goodbye_parse_mode" TEXT,
    "delete_after_secs" INTEGER,
    "mention_user" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "welcome_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auto_approval_rule_user_id_idx" ON "auto_approval_rule"("user_id");

-- CreateIndex
CREATE INDEX "auto_approval_rule_bot_id_idx" ON "auto_approval_rule"("bot_id");

-- CreateIndex
CREATE INDEX "auto_approval_rule_telegram_entity_id_idx" ON "auto_approval_rule"("telegram_entity_id");

-- CreateIndex
CREATE INDEX "auto_approval_rule_is_active_idx" ON "auto_approval_rule"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "auto_approval_rule_bot_id_telegram_entity_id_key" ON "auto_approval_rule"("bot_id", "telegram_entity_id");

-- CreateIndex
CREATE INDEX "welcome_config_user_id_idx" ON "welcome_config"("user_id");

-- CreateIndex
CREATE INDEX "welcome_config_bot_id_idx" ON "welcome_config"("bot_id");

-- CreateIndex
CREATE INDEX "welcome_config_telegram_entity_id_idx" ON "welcome_config"("telegram_entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "welcome_config_bot_id_telegram_entity_id_key" ON "welcome_config"("bot_id", "telegram_entity_id");

-- AddForeignKey
ALTER TABLE "auto_approval_rule" ADD CONSTRAINT "auto_approval_rule_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auto_approval_rule" ADD CONSTRAINT "auto_approval_rule_telegram_entity_id_fkey" FOREIGN KEY ("telegram_entity_id") REFERENCES "telegram_entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "welcome_config" ADD CONSTRAINT "welcome_config_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "welcome_config" ADD CONSTRAINT "welcome_config_telegram_entity_id_fkey" FOREIGN KEY ("telegram_entity_id") REFERENCES "telegram_entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
