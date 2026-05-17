-- The Curated Cart starter content for Neon/PostgreSQL.
-- Paste this whole script into the Neon SQL Editor and run it.
-- It is idempotent: seeded rows use stable ids/slugs and ON CONFLICT updates
-- existing seeded content instead of creating duplicates on repeated runs.

BEGIN;

-- Product image support for databases that have not run the Prisma migration yet.
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

-- Categories
INSERT INTO "Category" ("id", "name")
VALUES
  ('seed_category_home_decor', 'Home Decor'),
  ('seed_category_fashion_finds', 'Fashion Finds'),
  ('seed_category_skincare', 'Skincare'),
  ('seed_category_beauty_tools', 'Beauty Tools'),
  ('seed_category_mom_life_favorites', 'Mom Life Favorites'),
  ('seed_category_under_25_finds', 'Under $25 Finds'),
  ('seed_category_worth_the_splurge', 'Worth the Splurge'),
  ('seed_category_elevated_summer', 'Elevated Summer')
ON CONFLICT ("name") DO UPDATE
SET "name" = EXCLUDED."name";

-- Published affiliate products
INSERT INTO "Product" (
  "id",
  "name",
  "categoryId",
  "amazonLink",
  "affiliateLink",
  "imageUrl",
  "price",
  "source",
  "viralTrendNotes",
  "contentIdea",
  "blogPostStatus",
  "pinStatus",
  "tiktokStatus",
  "commissionPotential"
)
VALUES
  (
    'seed_product_minimalist_ceramic_vase_set',
    'Minimalist Ceramic Vase Set',
    (SELECT "id" FROM "Category" WHERE "name" = 'Home Decor'),
    'https://amazon.com/dp/B08SAMPLE1?tag=curatedcart-20',
    'https://amazon.com/dp/B08SAMPLE1?tag=curatedcart-20',
    'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&q=80&w=900',
    34.99,
    'Editorial Pick',
    'A neutral sculptural trio that makes shelves, consoles, and nightstands feel instantly styled.',
    'Style three easy shelf moments with warm neutrals and dried stems.',
    'Published',
    'Pending',
    'Pending',
    'Medium'
  ),
  (
    'seed_product_oversized_satin_pajama_set',
    'Oversized Satin Pajama Set',
    (SELECT "id" FROM "Category" WHERE "name" = 'Fashion Finds'),
    'https://amazon.com/dp/B08SAMPLE2?tag=curatedcart-20',
    'https://amazon.com/dp/B08SAMPLE2?tag=curatedcart-20',
    'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=900',
    42,
    'Instagram Reels',
    'Soft drape, neutral piping, and a boutique look without the boutique price.',
    'Compare lounge sets that look elevated enough for weekend hosting.',
    'Published',
    'Pending',
    'Pending',
    'High'
  ),
  (
    'seed_product_facial_ice_roller_for_de_puffing',
    'Facial Ice Roller for De-Puffing',
    (SELECT "id" FROM "Category" WHERE "name" = 'Skincare'),
    'https://amazon.com/dp/B08SAMPLE3?tag=curatedcart-20',
    'https://amazon.com/dp/B08SAMPLE3?tag=curatedcart-20',
    'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&q=80&w=900',
    18.95,
    'Amazon Favorites',
    'A simple morning reset that feels spa-like and fits the neutral vanity aesthetic.',
    'Build a five-minute morning glow routine under $50.',
    'Published',
    'Pending',
    'Pending',
    'Medium'
  ),
  (
    'seed_product_pearl_finish_makeup_brush_set',
    'Pearl Finish Makeup Brush Set',
    (SELECT "id" FROM "Category" WHERE "name" = 'Beauty Tools'),
    'https://amazon.com/dp/B08SAMPLE4?tag=curatedcart-20',
    'https://amazon.com/dp/B08SAMPLE4?tag=curatedcart-20',
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=900',
    24.5,
    'Creator Roundup',
    'Pretty enough to leave on the counter and practical enough for everyday makeup.',
    'Round up counter-worthy beauty tools that still perform.',
    'Published',
    'Pending',
    'Pending',
    'Medium'
  ),
  (
    'seed_product_woven_storage_basket_trio',
    'Woven Storage Basket Trio',
    (SELECT "id" FROM "Category" WHERE "name" = 'Mom Life Favorites'),
    'https://amazon.com/dp/B08SAMPLE5?tag=curatedcart-20',
    'https://amazon.com/dp/B08SAMPLE5?tag=curatedcart-20',
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=900',
    29.99,
    'Pinterest',
    'Soft-sided catchalls for toys, throws, and entryway clutter that still look intentional.',
    'Create a calm drop zone with baskets, labels, and neutral textures.',
    'Published',
    'Pending',
    'Pending',
    'High'
  ),
  (
    'seed_product_gold_rim_glass_coffee_mugs',
    'Gold Rim Glass Coffee Mugs',
    (SELECT "id" FROM "Category" WHERE "name" = 'Under $25 Finds'),
    'https://amazon.com/dp/B08SAMPLE6?tag=curatedcart-20',
    'https://amazon.com/dp/B08SAMPLE6?tag=curatedcart-20',
    'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=900',
    22.99,
    'TikTok Viral',
    'Cafe-at-home energy with a delicate gold rim that feels giftable and luxe.',
    'Style a cozy coffee bar with small upgrades under $25.',
    'Published',
    'Pending',
    'Pending',
    'Medium'
  )
ON CONFLICT ("id") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "categoryId" = EXCLUDED."categoryId",
  "amazonLink" = EXCLUDED."amazonLink",
  "affiliateLink" = EXCLUDED."affiliateLink",
  "imageUrl" = EXCLUDED."imageUrl",
  "price" = EXCLUDED."price",
  "source" = EXCLUDED."source",
  "viralTrendNotes" = EXCLUDED."viralTrendNotes",
  "contentIdea" = EXCLUDED."contentIdea",
  "blogPostStatus" = EXCLUDED."blogPostStatus",
  "pinStatus" = EXCLUDED."pinStatus",
  "tiktokStatus" = EXCLUDED."tiktokStatus",
  "commissionPotential" = EXCLUDED."commissionPotential";

-- Published blog posts
INSERT INTO "BlogPost" (
  "id",
  "title",
  "content",
  "slug",
  "categoryId",
  "metaTitle",
  "metaDescription",
  "featuredImage",
  "isPublished",
  "updatedAt"
)
VALUES
  (
    'seed_blog_amazon_finds_quietly_expensive_room',
    '6 Amazon Finds That Make a Room Feel Quietly Expensive',
    E'The easiest way to make a room feel more refined is to repeat soft neutrals, warm metals, and tactile textures. Start with one sculptural piece, add concealed storage, and finish with something that brings a little glow.\n\nThese pieces are intentionally versatile: they work on a console, vanity, entryway bench, coffee bar, or nursery shelf without making the room feel overly styled.',
    'amazon-finds-quietly-expensive-room',
    (SELECT "id" FROM "Category" WHERE "name" = 'Home Decor'),
    'Luxury-Looking Amazon Home Finds',
    'Neutral, texture-rich Amazon home finds that bring a polished designer feeling to everyday spaces.',
    'https://images.unsplash.com/photo-1616489953149-75517454e9c3?auto=format&fit=crop&q=80&w=1600',
    TRUE,
    NOW()
  ),
  (
    'seed_blog_pretty_five_minute_morning_routine_under_50',
    'A Pretty Five-Minute Morning Routine Under $50',
    E'A good morning routine does not need to be complicated. Keep the steps sensory and simple: cool, hydrate, blend, and go.\n\nThe best everyday tools are the ones you will actually reach for, so this edit focuses on items that feel calming, look elevated, and tuck neatly into a vanity tray.',
    'pretty-five-minute-morning-routine-under-50',
    (SELECT "id" FROM "Category" WHERE "name" = 'Skincare'),
    'Affordable Amazon Morning Routine Finds',
    'A quick, polished morning routine with affordable skincare and beauty tools that still look beautiful on the counter.',
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=1600',
    TRUE,
    NOW()
  ),
  (
    'seed_blog_neutral_weekend_finds_lounging_hosting_resetting',
    'Neutral Weekend Finds for Lounging, Hosting, and Resetting',
    E'Weekend pieces should feel comfortable without looking forgotten. A matching set, a better mug, and a few clutter-hiding details can make slow mornings feel much more intentional.\n\nThis edit keeps the palette warm and neutral, so every find layers easily with what you already own.',
    'neutral-weekend-finds-lounging-hosting-resetting',
    (SELECT "id" FROM "Category" WHERE "name" = 'Fashion Finds'),
    'Neutral Amazon Weekend Finds',
    'Soft, practical Amazon finds for a polished weekend at home, from pretty pajamas to coffee bar details.',
    'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&q=80&w=1600',
    TRUE,
    NOW()
  )
ON CONFLICT ("slug") DO UPDATE
SET
  "title" = EXCLUDED."title",
  "content" = EXCLUDED."content",
  "categoryId" = EXCLUDED."categoryId",
  "metaTitle" = EXCLUDED."metaTitle",
  "metaDescription" = EXCLUDED."metaDescription",
  "featuredImage" = EXCLUDED."featuredImage",
  "isPublished" = EXCLUDED."isPublished",
  "updatedAt" = NOW();

-- Reset relations for the seeded blog posts so repeated runs match this starter set.
DELETE FROM "_ProductBlogPosts"
WHERE "A" IN (
  SELECT "id"
  FROM "BlogPost"
  WHERE "slug" IN (
    'amazon-finds-quietly-expensive-room',
    'pretty-five-minute-morning-routine-under-50',
    'neutral-weekend-finds-lounging-hosting-resetting'
  )
);

-- Product/blog relations. In Prisma's implicit many-to-many table,
-- "A" references "BlogPost" and "B" references "Product".
INSERT INTO "_ProductBlogPosts" ("A", "B")
SELECT blog_posts."id", products."id"
FROM (
  VALUES
    ('amazon-finds-quietly-expensive-room', 'seed_product_minimalist_ceramic_vase_set'),
    ('amazon-finds-quietly-expensive-room', 'seed_product_woven_storage_basket_trio'),
    ('amazon-finds-quietly-expensive-room', 'seed_product_gold_rim_glass_coffee_mugs'),
    ('pretty-five-minute-morning-routine-under-50', 'seed_product_facial_ice_roller_for_de_puffing'),
    ('pretty-five-minute-morning-routine-under-50', 'seed_product_pearl_finish_makeup_brush_set'),
    ('neutral-weekend-finds-lounging-hosting-resetting', 'seed_product_oversized_satin_pajama_set'),
    ('neutral-weekend-finds-lounging-hosting-resetting', 'seed_product_gold_rim_glass_coffee_mugs'),
    ('neutral-weekend-finds-lounging-hosting-resetting', 'seed_product_woven_storage_basket_trio')
) AS relations ("slug", "productId")
JOIN "BlogPost" AS blog_posts ON blog_posts."slug" = relations."slug"
JOIN "Product" AS products ON products."id" = relations."productId"
ON CONFLICT ("A", "B") DO NOTHING;

COMMIT;
