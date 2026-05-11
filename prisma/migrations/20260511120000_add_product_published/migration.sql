ALTER TABLE "Product" ADD COLUMN "published" BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX "Product_published_dateAdded_idx" ON "Product"("published", "dateAdded");
