-- Add structured Amazon product metadata imported through Rainforest API.
ALTER TABLE "Product" ADD COLUMN "affiliatePlaceholderUrl" TEXT;
ALTER TABLE "Product" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "Product" ADD COLUMN "amazonAsin" TEXT;
ALTER TABLE "Product" ADD COLUMN "rating" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN "reviewCount" INTEGER;

ALTER TABLE "ProductLead" ADD COLUMN "rating" DOUBLE PRECISION;
ALTER TABLE "ProductLead" ADD COLUMN "reviewCount" INTEGER;
ALTER TABLE "ProductLead" ADD COLUMN "asin" TEXT;
ALTER TABLE "ProductLead" ADD COLUMN "affiliatePlaceholderUrl" TEXT;

CREATE INDEX "Product_amazonAsin_idx" ON "Product"("amazonAsin");
CREATE INDEX "ProductLead_asin_idx" ON "ProductLead"("asin");
