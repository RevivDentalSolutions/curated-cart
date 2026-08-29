-- The Curated Cart Scout schema for Neon/PostgreSQL.
-- Paste this whole script into the Neon SQL Editor and run it once.
-- It is additive/idempotent: it creates missing Scout tables, columns, and indexes
-- without dropping or deleting any existing data.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProductLeadStatus') THEN
    CREATE TYPE "ProductLeadStatus" AS ENUM ('New', 'Approved', 'Rejected');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "ProductLead" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "sourceUrl" TEXT,
  "imageUrl" TEXT,
  "trendKeyword" TEXT,
  "suggestedCategory" TEXT,
  "estimatedPrice" DOUBLE PRECISION,
  "reasonItMightSell" TEXT NOT NULL DEFAULT '',
  "viralityScore" INTEGER NOT NULL DEFAULT 0,
  "status" "ProductLeadStatus" NOT NULL DEFAULT 'New',
  "rating" DOUBLE PRECISION,
  "reviewCount" INTEGER,
  "asin" TEXT,
  "affiliatePlaceholderUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductLead_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ProductLead" ADD COLUMN IF NOT EXISTS "sourceUrl" TEXT;
ALTER TABLE "ProductLead" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "ProductLead" ADD COLUMN IF NOT EXISTS "trendKeyword" TEXT;
ALTER TABLE "ProductLead" ADD COLUMN IF NOT EXISTS "suggestedCategory" TEXT;
ALTER TABLE "ProductLead" ADD COLUMN IF NOT EXISTS "estimatedPrice" DOUBLE PRECISION;
ALTER TABLE "ProductLead" ADD COLUMN IF NOT EXISTS "reasonItMightSell" TEXT;
ALTER TABLE "ProductLead" ADD COLUMN IF NOT EXISTS "viralityScore" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ProductLead" ADD COLUMN IF NOT EXISTS "status" "ProductLeadStatus" NOT NULL DEFAULT 'New';
ALTER TABLE "ProductLead" ADD COLUMN IF NOT EXISTS "rating" DOUBLE PRECISION;
ALTER TABLE "ProductLead" ADD COLUMN IF NOT EXISTS "reviewCount" INTEGER;
ALTER TABLE "ProductLead" ADD COLUMN IF NOT EXISTS "asin" TEXT;
ALTER TABLE "ProductLead" ADD COLUMN IF NOT EXISTS "affiliatePlaceholderUrl" TEXT;
ALTER TABLE "ProductLead" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "ProductLead"
SET "reasonItMightSell" = COALESCE("reasonItMightSell", 'Imported into the Scout lead queue for review.'),
    "viralityScore" = COALESCE("viralityScore", 0),
    "status" = COALESCE("status", 'New'::"ProductLeadStatus"),
    "createdAt" = COALESCE("createdAt", CURRENT_TIMESTAMP);

ALTER TABLE "ProductLead" ALTER COLUMN "reasonItMightSell" SET DEFAULT '';
ALTER TABLE "ProductLead" ALTER COLUMN "reasonItMightSell" SET NOT NULL;
ALTER TABLE "ProductLead" ALTER COLUMN "viralityScore" SET DEFAULT 0;
ALTER TABLE "ProductLead" ALTER COLUMN "viralityScore" SET NOT NULL;
ALTER TABLE "ProductLead" ALTER COLUMN "status" SET DEFAULT 'New';
ALTER TABLE "ProductLead" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "ProductLead" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ProductLead" ALTER COLUMN "createdAt" SET NOT NULL;

CREATE TABLE IF NOT EXISTS "ScoutAutomationConfig" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "autoImportEnabled" BOOLEAN NOT NULL DEFAULT false,
  "autoApproveHighScoringLeads" BOOLEAN NOT NULL DEFAULT false,
  "autoGenerateContentBundles" BOOLEAN NOT NULL DEFAULT false,
  "highScoreThreshold" INTEGER NOT NULL DEFAULT 85,
  "rssFeeds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "amazonMoversUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "tiktokKeywords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "pinterestKeywords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "productUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "lastRunAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScoutAutomationConfig_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ScoutAutomationConfig" ADD COLUMN IF NOT EXISTS "autoImportEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ScoutAutomationConfig" ADD COLUMN IF NOT EXISTS "autoApproveHighScoringLeads" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ScoutAutomationConfig" ADD COLUMN IF NOT EXISTS "autoGenerateContentBundles" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ScoutAutomationConfig" ADD COLUMN IF NOT EXISTS "highScoreThreshold" INTEGER NOT NULL DEFAULT 85;
ALTER TABLE "ScoutAutomationConfig" ADD COLUMN IF NOT EXISTS "rssFeeds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ScoutAutomationConfig" ADD COLUMN IF NOT EXISTS "amazonMoversUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ScoutAutomationConfig" ADD COLUMN IF NOT EXISTS "tiktokKeywords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ScoutAutomationConfig" ADD COLUMN IF NOT EXISTS "pinterestKeywords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ScoutAutomationConfig" ADD COLUMN IF NOT EXISTS "productUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ScoutAutomationConfig" ADD COLUMN IF NOT EXISTS "lastRunAt" TIMESTAMP(3);
ALTER TABLE "ScoutAutomationConfig" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ScoutAutomationConfig" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

INSERT INTO "ScoutAutomationConfig" (
  "id",
  "autoImportEnabled",
  "autoApproveHighScoringLeads",
  "autoGenerateContentBundles",
  "highScoreThreshold",
  "rssFeeds",
  "amazonMoversUrls",
  "tiktokKeywords",
  "pinterestKeywords",
  "productUrls",
  "createdAt",
  "updatedAt"
)
VALUES (
  'default',
  false,
  false,
  false,
  85,
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO UPDATE
SET "updatedAt" = CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "ProductLead_status_createdAt_idx" ON "ProductLead"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "ProductLead_sourceUrl_idx" ON "ProductLead"("sourceUrl");
CREATE INDEX IF NOT EXISTS "ProductLead_asin_idx" ON "ProductLead"("asin");

DO $$
BEGIN
  IF to_regclass('"Product"') IS NOT NULL THEN
    ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "affiliatePlaceholderUrl" TEXT;
    ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
    ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "amazonAsin" TEXT;
    ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "rating" DOUBLE PRECISION;
    ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "reviewCount" INTEGER;
    ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "published" BOOLEAN NOT NULL DEFAULT true;
    CREATE INDEX IF NOT EXISTS "Product_amazonAsin_idx" ON "Product"("amazonAsin");
    CREATE INDEX IF NOT EXISTS "Product_published_dateAdded_idx" ON "Product"("published", "dateAdded");
  END IF;
END
$$;

-- Optional smoke-test settings for Run Scout Now:
-- Uncomment this block if you want the dashboard button to create keyword-only leads
-- immediately before adding your own automation sources in /dashboard/scout.
-- UPDATE "ScoutAutomationConfig"
-- SET "tiktokKeywords" = ARRAY['vanity restock organizer', 'bow makeup bag', 'under sink organizer']::TEXT[],
--     "pinterestKeywords" = ARRAY['cozy neutral bedroom finds', 'pretty pantry labels']::TEXT[],
--     "updatedAt" = CURRENT_TIMESTAMP
-- WHERE "id" = 'default';

COMMIT;
