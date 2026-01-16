-- DropIndex
DROP INDEX "promoter_config_bot_id_vault_entity_id_key";

-- CreateIndex
CREATE INDEX "promoter_config_bot_id_vault_entity_id_deleted_at_idx" ON "promoter_config"("bot_id", "vault_entity_id", "deleted_at");
