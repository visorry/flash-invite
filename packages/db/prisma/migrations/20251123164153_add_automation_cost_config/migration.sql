-- CreateTable
CREATE TABLE "automation_cost_config" (
    "id" TEXT NOT NULL,
    "feature_type" INTEGER NOT NULL,
    "cost_per_rule" INTEGER NOT NULL,
    "free_rules_allowed" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "automation_cost_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "automation_cost_config_feature_type_key" ON "automation_cost_config"("feature_type");
