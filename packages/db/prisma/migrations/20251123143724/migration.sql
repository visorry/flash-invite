-- AlterTable
ALTER TABLE "forward_rule" ADD COLUMN     "end_at_message_id" INTEGER,
ADD COLUMN     "interval_minutes" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "last_processed_msg_id" INTEGER,
ADD COLUMN     "message_queue" INTEGER[],
ADD COLUMN     "next_run_at" TIMESTAMPTZ(3),
ADD COLUMN     "repeat_when_done" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "schedule_mode" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "schedule_status" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shuffle" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "start_from_message_id" INTEGER;

-- CreateIndex
CREATE INDEX "forward_rule_schedule_mode_idx" ON "forward_rule"("schedule_mode");

-- CreateIndex
CREATE INDEX "forward_rule_next_run_at_idx" ON "forward_rule"("next_run_at");
