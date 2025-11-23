-- CreateTable
CREATE TABLE "forward_rule" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "bot_id" TEXT NOT NULL,
    "source_entity_id" TEXT NOT NULL,
    "destination_entity_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "forward_media" BOOLEAN NOT NULL DEFAULT true,
    "forward_text" BOOLEAN NOT NULL DEFAULT true,
    "forward_documents" BOOLEAN NOT NULL DEFAULT true,
    "forward_stickers" BOOLEAN NOT NULL DEFAULT false,
    "forward_polls" BOOLEAN NOT NULL DEFAULT true,
    "remove_links" BOOLEAN NOT NULL DEFAULT false,
    "add_watermark" TEXT,
    "include_keywords" TEXT[],
    "exclude_keywords" TEXT[],
    "forwarded_count" INTEGER NOT NULL DEFAULT 0,
    "last_forwarded_at" TIMESTAMPTZ(3),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "forward_rule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "forward_rule_user_id_idx" ON "forward_rule"("user_id");

-- CreateIndex
CREATE INDEX "forward_rule_bot_id_idx" ON "forward_rule"("bot_id");

-- CreateIndex
CREATE INDEX "forward_rule_source_entity_id_idx" ON "forward_rule"("source_entity_id");

-- CreateIndex
CREATE INDEX "forward_rule_destination_entity_id_idx" ON "forward_rule"("destination_entity_id");

-- CreateIndex
CREATE INDEX "forward_rule_is_active_idx" ON "forward_rule"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "forward_rule_bot_id_source_entity_id_destination_entity_id_key" ON "forward_rule"("bot_id", "source_entity_id", "destination_entity_id");

-- AddForeignKey
ALTER TABLE "forward_rule" ADD CONSTRAINT "forward_rule_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forward_rule" ADD CONSTRAINT "forward_rule_source_entity_id_fkey" FOREIGN KEY ("source_entity_id") REFERENCES "telegram_entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forward_rule" ADD CONSTRAINT "forward_rule_destination_entity_id_fkey" FOREIGN KEY ("destination_entity_id") REFERENCES "telegram_entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
