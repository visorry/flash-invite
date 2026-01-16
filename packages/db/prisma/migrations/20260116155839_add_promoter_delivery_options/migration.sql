-- AlterTable
ALTER TABLE "promoter_config" ADD COLUMN     "add_watermark" TEXT,
ADD COLUMN     "copy_mode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "delete_marketing_after_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "delete_marketing_interval" INTEGER,
ADD COLUMN     "delete_marketing_interval_unit" INTEGER,
ADD COLUMN     "hide_sender_name" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "include_caption_in_cta" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "remove_links" BOOLEAN NOT NULL DEFAULT false;
