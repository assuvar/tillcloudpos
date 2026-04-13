-- Store encrypted staff PIN for admin-authenticated reveal
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "pinEncrypted" TEXT;