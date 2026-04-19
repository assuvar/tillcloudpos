-- DayClosure persistence model migration
-- Handles both fresh DBs and DBs that already have a legacy day_closures table.

CREATE TABLE IF NOT EXISTS "day_closures" (
  "id" TEXT NOT NULL,
  "restaurant_id" TEXT NOT NULL,
  "closed_date" DATE NOT NULL,
  "total_revenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "total_orders" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "day_closures_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "day_closures"
  ADD COLUMN IF NOT EXISTS "closed_date" DATE,
  ADD COLUMN IF NOT EXISTS "total_revenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "total_orders" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'day_closures'
      AND column_name = 'business_date'
  ) THEN
    EXECUTE '
      UPDATE "day_closures"
      SET "closed_date" = "business_date"
      WHERE "closed_date" IS NULL
    ';
  END IF;
END$$;

ALTER TABLE "day_closures"
  ALTER COLUMN "closed_date" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'day_closures_restaurant_id_fkey'
  ) THEN
    ALTER TABLE "day_closures"
      ADD CONSTRAINT "day_closures_restaurant_id_fkey"
      FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;

CREATE UNIQUE INDEX IF NOT EXISTS "day_closures_restaurant_id_closed_date_key"
  ON "day_closures"("restaurant_id", "closed_date");

CREATE INDEX IF NOT EXISTS "day_closures_restaurant_id_closed_date_idx"
  ON "day_closures"("restaurant_id", "closed_date");
