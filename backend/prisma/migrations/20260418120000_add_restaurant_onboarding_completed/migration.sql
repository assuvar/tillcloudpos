-- Add restaurant-level onboarding completion flag for one-time tenant onboarding
ALTER TABLE "restaurants"
ADD COLUMN IF NOT EXISTS "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;
