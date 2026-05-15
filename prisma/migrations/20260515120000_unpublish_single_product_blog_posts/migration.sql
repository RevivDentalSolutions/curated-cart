-- Draft existing blog posts that are associated with exactly one product.
-- This preserves the posts and all product/category/affiliate/image data while
-- removing auto-generated single-product posts from the public blog.
UPDATE "BlogPost"
SET "isPublished" = false,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "isPublished" = true
  AND "id" IN (
    SELECT "A"
    FROM "_ProductBlogPosts"
    GROUP BY "A"
    HAVING COUNT("B") = 1
  );
