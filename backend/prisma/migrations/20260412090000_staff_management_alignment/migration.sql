-- Staff management alignment
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "name" TEXT,
ADD COLUMN IF NOT EXISTS "phone" TEXT,
ADD COLUMN IF NOT EXISTS "permissions" JSONB;

UPDATE "users"
SET "name" = "fullName"
WHERE "name" IS NULL;
