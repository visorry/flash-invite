-- CreateTable
CREATE TABLE "payment_gateway_config" (
    "id" TEXT NOT NULL,
    "gateway" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "merchant_id" TEXT,
    "salt_key" TEXT,
    "salt_index" INTEGER,
    "environment" TEXT NOT NULL DEFAULT 'SANDBOX',
    "webhook_secret" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "payment_gateway_config_pkey" PRIMARY KEY ("id")
);
