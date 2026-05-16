ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "published" BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS "Product_published_dateAdded_idx" ON "Product"("published", "dateAdded");
