-- AlterTable
ALTER TABLE "forward_rule" ADD COLUMN     "broadcast_delete_after" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "broadcast_delete_interval" INTEGER,
ADD COLUMN     "broadcast_delete_unit" INTEGER;
