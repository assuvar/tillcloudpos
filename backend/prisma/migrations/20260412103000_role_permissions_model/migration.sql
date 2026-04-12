-- Add role-level permissions and remove per-user permissions
ALTER TABLE "users"
DROP COLUMN IF EXISTS "permissions";

CREATE TABLE IF NOT EXISTS "role_permissions" (
  "id" TEXT NOT NULL,
  "restaurantId" TEXT NOT NULL,
  "role" "UserRole" NOT NULL,
  "permissions" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "role_permissions_restaurantId_role_key"
  ON "role_permissions"("restaurantId", "role");

ALTER TABLE "role_permissions"
ADD CONSTRAINT "role_permissions_restaurantId_fkey"
FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
