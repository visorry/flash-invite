-- AlterTable
ALTER TABLE "user" ADD COLUMN     "phone_number" TEXT;

-- CreateTable
CREATE TABLE "payment_order" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" INTEGER NOT NULL,
    "type" INTEGER NOT NULL,
    "reference_id" TEXT,
    "payment_session_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "payment_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_bundle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tokens" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "token_bundle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_order_order_id_key" ON "payment_order"("order_id");

-- CreateIndex
CREATE INDEX "payment_order_user_id_idx" ON "payment_order"("user_id");

-- CreateIndex
CREATE INDEX "payment_order_status_idx" ON "payment_order"("status");

-- CreateIndex
CREATE INDEX "payment_order_order_id_idx" ON "payment_order"("order_id");

-- AddForeignKey
ALTER TABLE "payment_order" ADD CONSTRAINT "payment_order_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
