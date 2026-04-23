-- Restore per-user permission overrides for staff-level customization.
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "permissions" JSONB;
