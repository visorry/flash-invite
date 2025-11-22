-- CreateTable
CREATE TABLE "broadcast_template" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parse_mode" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "broadcast_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broadcast" (
    "id" TEXT NOT NULL,
    "template_id" TEXT,
    "content" TEXT NOT NULL,
    "parse_mode" TEXT,
    "status" INTEGER NOT NULL DEFAULT 0,
    "total_recipients" INTEGER NOT NULL DEFAULT 0,
    "sent_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "filter_criteria" JSONB,
    "recipient_ids" TEXT[],
    "started_at" TIMESTAMPTZ(3),
    "completed_at" TIMESTAMPTZ(3),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "broadcast_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "broadcast_template_name_idx" ON "broadcast_template"("name");

-- CreateIndex
CREATE INDEX "broadcast_template_is_active_idx" ON "broadcast_template"("is_active");

-- CreateIndex
CREATE INDEX "broadcast_status_idx" ON "broadcast"("status");

-- CreateIndex
CREATE INDEX "broadcast_created_at_idx" ON "broadcast"("created_at");

-- AddForeignKey
ALTER TABLE "broadcast" ADD CONSTRAINT "broadcast_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "broadcast_template"("id") ON DELETE SET NULL ON UPDATE CASCADE;
