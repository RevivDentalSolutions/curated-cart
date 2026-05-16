-- Add structured Amazon product metadata imported through Rainforest API.
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "affiliatePlaceholderUrl" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "amazonAsin" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "rating" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "reviewCount" INTEGER;

ALTER TABLE "ProductLead" ADD COLUMN IF NOT EXISTS "rating" DOUBLE PRECISION;
ALTER TABLE "ProductLead" ADD COLUMN IF NOT EXISTS "reviewCount" INTEGER;
ALTER TABLE "ProductLead" ADD COLUMN IF NOT EXISTS "asin" TEXT;
ALTER TABLE "ProductLead" ADD COLUMN IF NOT EXISTS "affiliatePlaceholderUrl" TEXT;

CREATE INDEX IF NOT EXISTS "Product_amazonAsin_idx" ON "Product"("amazonAsin");
CREATE INDEX IF NOT EXISTS "ProductLead_asin_idx" ON "ProductLead"("asin");
