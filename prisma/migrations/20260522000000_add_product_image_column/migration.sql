-- Ensure Product.image exists in environments where schema drift occurred.
ALTER TABLE "Product"
ADD COLUMN IF NOT EXISTS "image" TEXT;
