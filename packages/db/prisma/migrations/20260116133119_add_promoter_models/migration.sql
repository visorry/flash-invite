-- CreateTable
CREATE TABLE "promoter_config" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "bot_id" TEXT NOT NULL,
    "vault_entity_id" TEXT NOT NULL,
    "marketing_entity_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "cta_template" TEXT NOT NULL DEFAULT '🔥 Click here to get the content: {link}',
    "auto_post_to_marketing" BOOLEAN NOT NULL DEFAULT true,
    "token_expiration_enabled" BOOLEAN NOT NULL DEFAULT false,
    "token_expiration_days" INTEGER,
    "invalid_token_message" TEXT NOT NULL DEFAULT '❌ This link is invalid or has been removed.',
    "expired_token_message" TEXT NOT NULL DEFAULT '⏰ This link has expired.',
    "total_captures" INTEGER NOT NULL DEFAULT 0,
    "total_marketing_posts" INTEGER NOT NULL DEFAULT 0,
    "total_deliveries" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "promoter_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promoter_post" (
    "id" TEXT NOT NULL,
    "config_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "media_type" INTEGER NOT NULL,
    "caption" TEXT,
    "source_message_id" INTEGER NOT NULL,
    "source_chat_id" TEXT NOT NULL,
    "marketing_message_id" INTEGER,
    "marketing_chat_id" TEXT,
    "marketing_posted_at" TIMESTAMPTZ(3),
    "is_expired" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMPTZ(3),
    "delivery_count" INTEGER NOT NULL DEFAULT 0,
    "last_delivered_at" TIMESTAMPTZ(3),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "promoter_post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promoter_delivery" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "telegram_user_id" TEXT NOT NULL,
    "username" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "delivered_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "promoter_delivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "promoter_config_user_id_idx" ON "promoter_config"("user_id");

-- CreateIndex
CREATE INDEX "promoter_config_bot_id_idx" ON "promoter_config"("bot_id");

-- CreateIndex
CREATE INDEX "promoter_config_vault_entity_id_idx" ON "promoter_config"("vault_entity_id");

-- CreateIndex
CREATE INDEX "promoter_config_marketing_entity_id_idx" ON "promoter_config"("marketing_entity_id");

-- CreateIndex
CREATE INDEX "promoter_config_is_active_idx" ON "promoter_config"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "promoter_config_bot_id_vault_entity_id_key" ON "promoter_config"("bot_id", "vault_entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "promoter_post_token_key" ON "promoter_post"("token");

-- CreateIndex
CREATE INDEX "promoter_post_config_id_idx" ON "promoter_post"("config_id");

-- CreateIndex
CREATE INDEX "promoter_post_token_idx" ON "promoter_post"("token");

-- CreateIndex
CREATE INDEX "promoter_post_is_expired_idx" ON "promoter_post"("is_expired");

-- CreateIndex
CREATE INDEX "promoter_post_expires_at_idx" ON "promoter_post"("expires_at");

-- CreateIndex
CREATE INDEX "promoter_post_created_at_idx" ON "promoter_post"("created_at");

-- CreateIndex
CREATE INDEX "promoter_delivery_post_id_idx" ON "promoter_delivery"("post_id");

-- CreateIndex
CREATE INDEX "promoter_delivery_telegram_user_id_idx" ON "promoter_delivery"("telegram_user_id");

-- CreateIndex
CREATE INDEX "promoter_delivery_delivered_at_idx" ON "promoter_delivery"("delivered_at");

-- AddForeignKey
ALTER TABLE "promoter_config" ADD CONSTRAINT "promoter_config_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promoter_config" ADD CONSTRAINT "promoter_config_vault_entity_id_fkey" FOREIGN KEY ("vault_entity_id") REFERENCES "telegram_entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promoter_config" ADD CONSTRAINT "promoter_config_marketing_entity_id_fkey" FOREIGN KEY ("marketing_entity_id") REFERENCES "telegram_entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promoter_post" ADD CONSTRAINT "promoter_post_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "promoter_config"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promoter_delivery" ADD CONSTRAINT "promoter_delivery_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "promoter_post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
