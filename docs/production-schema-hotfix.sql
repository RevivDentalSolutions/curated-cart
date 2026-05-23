-- Production schema drift hotfix for Curated Cart (PostgreSQL)
-- Safe, idempotent patch: uses IF NOT EXISTS and guarded constraints/indexes.

BEGIN;

-- =========================
-- Category
-- =========================
ALTER TABLE IF EXISTS "Category"
  ADD COLUMN IF NOT EXISTS "name" TEXT;

-- =========================
-- Product
-- =========================
ALTER TABLE IF EXISTS "Product"
  ADD COLUMN IF NOT EXISTS "name" TEXT,
  ADD COLUMN IF NOT EXISTS "categoryId" TEXT,
  ADD COLUMN IF NOT EXISTS "image" TEXT,
  ADD COLUMN IF NOT EXISTS "amazonLink" TEXT,
  ADD COLUMN IF NOT EXISTS "affiliateLink" TEXT,
  ADD COLUMN IF NOT EXISTS "price" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "source" TEXT,
  ADD COLUMN IF NOT EXISTS "viralTrendNotes" TEXT,
  ADD COLUMN IF NOT EXISTS "contentIdea" TEXT,
  ADD COLUMN IF NOT EXISTS "blogPostStatus" TEXT DEFAULT 'Needs Content',
  ADD COLUMN IF NOT EXISTS "pinStatus" TEXT DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS "tiktokStatus" TEXT DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS "commissionPotential" TEXT,
  ADD COLUMN IF NOT EXISTS "dateAdded" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- =========================
-- BlogPost
-- =========================
ALTER TABLE IF EXISTS "BlogPost"
  ADD COLUMN IF NOT EXISTS "title" TEXT,
  ADD COLUMN IF NOT EXISTS "content" TEXT,
  ADD COLUMN IF NOT EXISTS "slug" TEXT,
  ADD COLUMN IF NOT EXISTS "categoryId" TEXT,
  ADD COLUMN IF NOT EXISTS "metaTitle" TEXT,
  ADD COLUMN IF NOT EXISTS "metaDescription" TEXT,
  ADD COLUMN IF NOT EXISTS "featuredImage" TEXT,
  ADD COLUMN IF NOT EXISTS "isPublished" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- =========================
-- ContentBundle
-- =========================
CREATE TABLE IF NOT EXISTS "ContentBundle" (
  "id" TEXT PRIMARY KEY,
  "productId" TEXT NOT NULL,
  "blogPostTitle" TEXT,
  "blogPostOutline" TEXT,
  "shortDescription" TEXT,
  "pinTitle" TEXT,
  "pinDescription" TEXT,
  "tiktokHook" TEXT,
  "tiktokScript" TEXT,
  "facebookCaption" TEXT,
  "emailBlurb" TEXT,
  "suggestedHashtags" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- Join table for Product <-> BlogPost many-to-many
-- Prisma convention: _ProductBlogPosts
-- =========================
CREATE TABLE IF NOT EXISTS "_ProductBlogPosts" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL
);

-- Unique and lookup indexes for join table
CREATE UNIQUE INDEX IF NOT EXISTS "_ProductBlogPosts_AB_unique" ON "_ProductBlogPosts"("A", "B");
CREATE INDEX IF NOT EXISTS "_ProductBlogPosts_B_index" ON "_ProductBlogPosts"("B");

-- =========================
-- Uniqueness constraints required by Prisma schema
-- =========================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Category_name_key'
  ) THEN
    ALTER TABLE "Category" ADD CONSTRAINT "Category_name_key" UNIQUE ("name");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'BlogPost_slug_key'
  ) THEN
    ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_slug_key" UNIQUE ("slug");
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ContentBundle_productId_key'
  ) THEN
    ALTER TABLE "ContentBundle" ADD CONSTRAINT "ContentBundle_productId_key" UNIQUE ("productId");
  END IF;
END $$;

-- =========================
-- Foreign keys (guarded)
-- =========================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Product_categoryId_fkey'
  ) THEN
    ALTER TABLE "Product"
      ADD CONSTRAINT "Product_categoryId_fkey"
      FOREIGN KEY ("categoryId") REFERENCES "Category"("id")
      ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'BlogPost_categoryId_fkey'
  ) THEN
    ALTER TABLE "BlogPost"
      ADD CONSTRAINT "BlogPost_categoryId_fkey"
      FOREIGN KEY ("categoryId") REFERENCES "Category"("id")
      ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ContentBundle_productId_fkey'
  ) THEN
    ALTER TABLE "ContentBundle"
      ADD CONSTRAINT "ContentBundle_productId_fkey"
      FOREIGN KEY ("productId") REFERENCES "Product"("id")
      ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = '_ProductBlogPosts_A_fkey'
  ) THEN
    ALTER TABLE "_ProductBlogPosts"
      ADD CONSTRAINT "_ProductBlogPosts_A_fkey"
      FOREIGN KEY ("A") REFERENCES "Product"("id")
      ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = '_ProductBlogPosts_B_fkey'
  ) THEN
    ALTER TABLE "_ProductBlogPosts"
      ADD CONSTRAINT "_ProductBlogPosts_B_fkey"
      FOREIGN KEY ("B") REFERENCES "BlogPost"("id")
      ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;
END $$;

COMMIT;
