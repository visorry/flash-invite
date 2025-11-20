-- CreateTable
CREATE TABLE "join_log" (
    "id" TEXT NOT NULL,
    "telegram_user_id" TEXT NOT NULL,
    "telegram_entity_id" TEXT NOT NULL,
    "invite_link_id" TEXT NOT NULL,
    "username" TEXT,
    "full_name" TEXT,
    "duration_type" INTEGER NOT NULL,
    "duration_seconds" INTEGER NOT NULL,
    "tokens_cost" INTEGER NOT NULL,
    "is_renewal" BOOLEAN NOT NULL DEFAULT false,
    "previous_expires_at" TIMESTAMPTZ(3),
    "new_expires_at" TIMESTAMPTZ(3) NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "join_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "join_log_telegram_user_id_idx" ON "join_log"("telegram_user_id");

-- CreateIndex
CREATE INDEX "join_log_telegram_entity_id_idx" ON "join_log"("telegram_entity_id");

-- CreateIndex
CREATE INDEX "join_log_invite_link_id_idx" ON "join_log"("invite_link_id");

-- CreateIndex
CREATE INDEX "join_log_created_at_idx" ON "join_log"("created_at");

-- AddForeignKey
ALTER TABLE "join_log" ADD CONSTRAINT "join_log_telegram_entity_id_fkey" FOREIGN KEY ("telegram_entity_id") REFERENCES "telegram_entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
