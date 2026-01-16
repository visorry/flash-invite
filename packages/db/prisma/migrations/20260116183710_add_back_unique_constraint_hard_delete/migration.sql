/*
  Warnings:

  - A unique constraint covering the columns `[bot_id,vault_entity_id]` on the table `promoter_config` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "promoter_config_bot_id_vault_entity_id_deleted_at_idx";

-- CreateIndex
CREATE UNIQUE INDEX "promoter_config_bot_id_vault_entity_id_key" ON "promoter_config"("bot_id", "vault_entity_id");
