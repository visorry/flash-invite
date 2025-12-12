-- CreateTable
CREATE TABLE "pending_approval" (
    "id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "bot_id" TEXT NOT NULL,
    "chat_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "username" TEXT,
    "first_name" TEXT,
    "is_premium" BOOLEAN NOT NULL DEFAULT false,
    "scheduled_for" TIMESTAMPTZ(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "processed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "pending_approval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pending_approval_rule_id_idx" ON "pending_approval"("rule_id");

-- CreateIndex
CREATE INDEX "pending_approval_status_idx" ON "pending_approval"("status");

-- CreateIndex
CREATE INDEX "pending_approval_scheduled_for_idx" ON "pending_approval"("scheduled_for");

-- CreateIndex
CREATE INDEX "pending_approval_bot_id_chat_id_user_id_idx" ON "pending_approval"("bot_id", "chat_id", "user_id");

-- AddForeignKey
ALTER TABLE "pending_approval" ADD CONSTRAINT "pending_approval_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "auto_approval_rule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
