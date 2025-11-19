-- CreateTable
CREATE TABLE "group_member" (
    "id" TEXT NOT NULL,
    "telegram_user_id" TEXT NOT NULL,
    "telegram_entity_id" TEXT NOT NULL,
    "username" TEXT,
    "full_name" TEXT,
    "invite_link" TEXT NOT NULL,
    "joined_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "kicked_at" TIMESTAMPTZ(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "group_member_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "group_member_telegram_entity_id_idx" ON "group_member"("telegram_entity_id");

-- CreateIndex
CREATE INDEX "group_member_expires_at_idx" ON "group_member"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "group_member_telegram_user_id_telegram_entity_id_key" ON "group_member"("telegram_user_id", "telegram_entity_id");

-- AddForeignKey
ALTER TABLE "group_member" ADD CONSTRAINT "group_member_telegram_entity_id_fkey" FOREIGN KEY ("telegram_entity_id") REFERENCES "telegram_entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
