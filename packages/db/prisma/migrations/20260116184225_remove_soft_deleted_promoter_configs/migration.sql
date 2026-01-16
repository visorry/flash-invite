-- Delete all soft-deleted promoter configurations
DELETE FROM "promoter_config" WHERE "deleted_at" IS NOT NULL;
