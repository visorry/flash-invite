-- AlterTable
ALTER TABLE "auto_drop_rule" ADD COLUMN     "end_message" TEXT,
ADD COLUMN     "start_message" TEXT,
ALTER COLUMN "source_entity_id" DROP NOT NULL;
