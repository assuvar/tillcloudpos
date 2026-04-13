-- Audit trail for staff PIN operations
CREATE TABLE IF NOT EXISTS "pin_audit_logs" (
  "id" TEXT NOT NULL,
  "restaurantId" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "staffUserId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "pin_audit_logs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "pin_audit_logs_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "pin_audit_logs_restaurantId_createdAt_idx"
ON "pin_audit_logs"("restaurantId", "createdAt");

CREATE INDEX IF NOT EXISTS "pin_audit_logs_staffUserId_createdAt_idx"
ON "pin_audit_logs"("staffUserId", "createdAt");

CREATE INDEX IF NOT EXISTS "pin_audit_logs_actorUserId_createdAt_idx"
ON "pin_audit_logs"("actorUserId", "createdAt");