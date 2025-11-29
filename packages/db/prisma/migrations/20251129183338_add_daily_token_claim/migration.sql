-- AlterTable
ALTER TABLE "plan" ADD COLUMN     "daily_tokens" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "daily_token_claim" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "tokens_granted" INTEGER NOT NULL,
    "claim_date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_token_claim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "daily_token_claim_user_id_idx" ON "daily_token_claim"("user_id");

-- CreateIndex
CREATE INDEX "daily_token_claim_subscription_id_idx" ON "daily_token_claim"("subscription_id");

-- CreateIndex
CREATE INDEX "daily_token_claim_claim_date_idx" ON "daily_token_claim"("claim_date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_token_claim_user_id_claim_date_key" ON "daily_token_claim"("user_id", "claim_date");

-- AddForeignKey
ALTER TABLE "daily_token_claim" ADD CONSTRAINT "daily_token_claim_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_token_claim" ADD CONSTRAINT "daily_token_claim_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
