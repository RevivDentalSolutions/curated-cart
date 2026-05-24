-- Paste-ready Neon/PostgreSQL migration for approval-based Pinterest pin drafts.
-- Safe to run in the Neon SQL Editor. This migration is additive only.
-- It does not DROP or DELETE any existing data.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PinterestPinStatus') THEN
    CREATE TYPE "PinterestPinStatus" AS ENUM ('Draft', 'Ready', 'Published', 'Failed');
  END IF;
END
$$;

ALTER TYPE "PinterestPinStatus" ADD VALUE IF NOT EXISTS 'Draft';
ALTER TYPE "PinterestPinStatus" ADD VALUE IF NOT EXISTS 'Ready';
ALTER TYPE "PinterestPinStatus" ADD VALUE IF NOT EXISTS 'Published';
ALTER TYPE "PinterestPinStatus" ADD VALUE IF NOT EXISTS 'Failed';

CREATE TABLE IF NOT EXISTS "PinterestPin" (
  "id" TEXT NOT NULL,
  "productId" TEXT,
  "blogPostId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "destinationUrl" TEXT NOT NULL,
  "imageUrl" TEXT,
  "imagePrompt" TEXT,
  "altText" TEXT NOT NULL,
  "boardName" TEXT NOT NULL,
  "boardId" TEXT,
  "status" "PinterestPinStatus" NOT NULL DEFAULT 'Draft',
  "pinterestPinId" TEXT,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PinterestPin_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PinterestPin_status_idx" ON "PinterestPin"("status");
CREATE INDEX IF NOT EXISTS "PinterestPin_status_createdAt_idx" ON "PinterestPin"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "PinterestPin_productId_idx" ON "PinterestPin"("productId");
CREATE INDEX IF NOT EXISTS "PinterestPin_blogPostId_idx" ON "PinterestPin"("blogPostId");
CREATE INDEX IF NOT EXISTS "PinterestPin_boardId_idx" ON "PinterestPin"("boardId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'PinterestPin_productId_fkey'
  ) THEN
    ALTER TABLE "PinterestPin" ADD CONSTRAINT "PinterestPin_productId_fkey"
      FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'PinterestPin_blogPostId_fkey'
  ) THEN
    ALTER TABLE "PinterestPin" ADD CONSTRAINT "PinterestPin_blogPostId_fkey"
      FOREIGN KEY ("blogPostId") REFERENCES "BlogPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;
