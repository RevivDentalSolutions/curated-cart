BEGIN;

-- Step 1: Safely create the canonical category rows if they do not already exist.
-- Prisma stores Category.id as TEXT; generated text IDs avoid relying on database extensions.
INSERT INTO "Category" ("id", "name")
SELECT 'category_beauty_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16), 'Beauty'
WHERE NOT EXISTS (SELECT 1 FROM "Category" WHERE "name" = 'Beauty');

INSERT INTO "Category" ("id", "name")
SELECT 'category_hair_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16), 'Hair'
WHERE NOT EXISTS (SELECT 1 FROM "Category" WHERE "name" = 'Hair');

INSERT INTO "Category" ("id", "name")
SELECT 'category_fashion_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16), 'Fashion'
WHERE NOT EXISTS (SELECT 1 FROM "Category" WHERE "name" = 'Fashion');

INSERT INTO "Category" ("id", "name")
SELECT 'category_home_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16), 'Home'
WHERE NOT EXISTS (SELECT 1 FROM "Category" WHERE "name" = 'Home');

INSERT INTO "Category" ("id", "name")
SELECT 'category_kitchen_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16), 'Kitchen'
WHERE NOT EXISTS (SELECT 1 FROM "Category" WHERE "name" = 'Kitchen');

INSERT INTO "Category" ("id", "name")
SELECT 'category_wellness_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16), 'Wellness'
WHERE NOT EXISTS (SELECT 1 FROM "Category" WHERE "name" = 'Wellness');

INSERT INTO "Category" ("id", "name")
SELECT 'category_mom_life_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16), 'Mom Life'
WHERE NOT EXISTS (SELECT 1 FROM "Category" WHERE "name" = 'Mom Life');

INSERT INTO "Category" ("id", "name")
SELECT 'category_amazon_favorites_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16), 'Amazon Favorites'
WHERE NOT EXISTS (SELECT 1 FROM "Category" WHERE "name" = 'Amazon Favorites');

INSERT INTO "Category" ("id", "name")
SELECT 'category_elevated_summer_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16), 'Elevated Summer'
WHERE NOT EXISTS (SELECT 1 FROM "Category" WHERE "name" = 'Elevated Summer');

-- Step 2: Move products and blog posts from legacy Beauty category names into Beauty.
UPDATE "Product" AS p
SET "categoryId" = target.id
FROM "Category" AS source, "Category" AS target
WHERE p."categoryId" = source.id
  AND source."name" IN ('Skincare', 'Beauty Tools')
  AND target."name" = 'Beauty'
  AND source.id <> target.id;

UPDATE "BlogPost" AS b
SET "categoryId" = target.id
FROM "Category" AS source, "Category" AS target
WHERE b."categoryId" = source.id
  AND source."name" IN ('Skincare', 'Beauty Tools')
  AND target."name" = 'Beauty'
  AND source.id <> target.id;

-- Step 3: Move products and blog posts from Fashion Finds into Fashion.
UPDATE "Product" AS p
SET "categoryId" = target.id
FROM "Category" AS source, "Category" AS target
WHERE p."categoryId" = source.id
  AND source."name" = 'Fashion Finds'
  AND target."name" = 'Fashion'
  AND source.id <> target.id;

UPDATE "BlogPost" AS b
SET "categoryId" = target.id
FROM "Category" AS source, "Category" AS target
WHERE b."categoryId" = source.id
  AND source."name" = 'Fashion Finds'
  AND target."name" = 'Fashion'
  AND source.id <> target.id;

-- Step 4: Move products and blog posts from Home Decor into Home.
UPDATE "Product" AS p
SET "categoryId" = target.id
FROM "Category" AS source, "Category" AS target
WHERE p."categoryId" = source.id
  AND source."name" = 'Home Decor'
  AND target."name" = 'Home'
  AND source.id <> target.id;

UPDATE "BlogPost" AS b
SET "categoryId" = target.id
FROM "Category" AS source, "Category" AS target
WHERE b."categoryId" = source.id
  AND source."name" = 'Home Decor'
  AND target."name" = 'Home'
  AND source.id <> target.id;

-- Step 5: Move products and blog posts from Mom Life Favorites into Mom Life.
UPDATE "Product" AS p
SET "categoryId" = target.id
FROM "Category" AS source, "Category" AS target
WHERE p."categoryId" = source.id
  AND source."name" = 'Mom Life Favorites'
  AND target."name" = 'Mom Life'
  AND source.id <> target.id;

UPDATE "BlogPost" AS b
SET "categoryId" = target.id
FROM "Category" AS source, "Category" AS target
WHERE b."categoryId" = source.id
  AND source."name" = 'Mom Life Favorites'
  AND target."name" = 'Mom Life'
  AND source.id <> target.id;

-- Step 6: Move value/splurge legacy categories into Amazon Favorites.
UPDATE "Product" AS p
SET "categoryId" = target.id
FROM "Category" AS source, "Category" AS target
WHERE p."categoryId" = source.id
  AND source."name" IN ('Under $25 Finds', 'Worth the Splurge')
  AND target."name" = 'Amazon Favorites'
  AND source.id <> target.id;

UPDATE "BlogPost" AS b
SET "categoryId" = target.id
FROM "Category" AS source, "Category" AS target
WHERE b."categoryId" = source.id
  AND source."name" IN ('Under $25 Finds', 'Worth the Splurge')
  AND target."name" = 'Amazon Favorites'
  AND source.id <> target.id;

-- Step 7: Delete legacy duplicate categories only after no products or blog posts still reference them.
DELETE FROM "Category" AS c
WHERE c."name" IN (
  'Skincare',
  'Beauty Tools',
  'Fashion Finds',
  'Home Decor',
  'Mom Life Favorites',
  'Under $25 Finds',
  'Worth the Splurge'
)
AND NOT EXISTS (SELECT 1 FROM "Product" AS p WHERE p."categoryId" = c.id)
AND NOT EXISTS (SELECT 1 FROM "BlogPost" AS b WHERE b."categoryId" = c.id);

-- Step 8: Delete any other empty non-canonical categories without touching products, blog posts, or links.
DELETE FROM "Category" AS c
WHERE c."name" NOT IN (
  'Beauty',
  'Hair',
  'Fashion',
  'Home',
  'Kitchen',
  'Wellness',
  'Mom Life',
  'Amazon Favorites',
  'Elevated Summer'
)
AND NOT EXISTS (SELECT 1 FROM "Product" AS p WHERE p."categoryId" = c.id)
AND NOT EXISTS (SELECT 1 FROM "BlogPost" AS b WHERE b."categoryId" = c.id);

-- Verification 1: all remaining categories.
SELECT
  c.id,
  c."name"
FROM "Category" AS c
ORDER BY c."name";

-- Verification 2: product count per category.
SELECT
  c."name" AS category_name,
  COUNT(p.id) AS product_count
FROM "Category" AS c
LEFT JOIN "Product" AS p ON p."categoryId" = c.id
GROUP BY c.id, c."name"
ORDER BY c."name";

COMMIT;
