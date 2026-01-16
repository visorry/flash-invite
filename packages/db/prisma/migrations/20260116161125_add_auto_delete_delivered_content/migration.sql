-- AlterTable
ALTER TABLE "promoter_config" ADD COLUMN     "delete_delivered_after_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "delete_delivered_interval" INTEGER,
ADD COLUMN     "delete_delivered_interval_unit" INTEGER;

-- AlterTable
ALTER TABLE "promoter_delivery" ADD COLUMN     "chat_id" TEXT,
ADD COLUMN     "delivered_message_ids" INTEGER[];
