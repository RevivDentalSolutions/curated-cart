# Neon production baseline for Prisma P3005

Use this when Vercel fails with Prisma `P3005`:

```text
The database schema is not empty.
Prisma migrate deploy cannot run because the existing production database was not baselined.
```

Do **not** run `prisma migrate reset`, `prisma db push --force-reset`, or destructive SQL against production. The goal is to preserve existing `Category`, `Product`, `BlogPost`, and related content.

## 1) Confirm production schema state

Run these read-only checks against the production Neon database:

```bash
DATABASE_URL="postgresql://...production direct or pooled url..." npx prisma migrate status
```

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'Product'
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'BlogPost'
ORDER BY ordinal_position;

SELECT migration_name, finished_at, rolled_back_at
FROM "_prisma_migrations"
ORDER BY finished_at NULLS LAST, migration_name;
```

If `_prisma_migrations` is missing or empty while app tables already exist, the database needs a baseline.

## 2) Migrations to mark applied when only `Product.description` is missing

If the read-only schema check confirms the existing production schema already has the objects from the older migrations and the only missing current requirement is `Product.description`, mark all migrations before `20260705000000_add_product_description` as applied:

```bash
export DATABASE_URL="postgresql://...production direct url..."

npx prisma migrate resolve --applied 20260510120000_add_product_leads
npx prisma migrate resolve --applied 20260510130000_add_scout_automation
npx prisma migrate resolve --applied 20260510143000_add_rainforest_product_fields
npx prisma migrate resolve --applied 20260510195500_add_product_image_url
npx prisma migrate resolve --applied 20260511120000_add_product_published
npx prisma migrate resolve --applied 20260511130000_add_blog_post_excerpt
npx prisma migrate resolve --applied 20260511143000_add_pinterest_pins
npx prisma migrate resolve --applied 20260515120000_unpublish_single_product_blog_posts
npx prisma migrate resolve --applied 20260520000000_init
npx prisma migrate resolve --applied 20260522000000_add_product_image_column
npx prisma migrate resolve --applied 20260524010000_add_admin_product_fields
```

Do **not** mark `20260705000000_add_product_description` as applied if production is missing `Product.description`. That migration should be the one that actually runs.

## 3) Deploy only the missing description migration

After the baseline resolve commands finish, run:

```bash
export DATABASE_URL="postgresql://...production direct url..."
npx prisma migrate deploy
```

That should apply only:

```text
20260705000000_add_product_description
```

Then verify:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'Product'
  AND column_name = 'description';
```

## 4) Re-enable Vercel migration deploy

After the production database is baselined, set this Vercel environment variable and redeploy:

```text
PRISMA_PRODUCTION_BASELINED=true
```

Also confirm Vercel has:

```text
DATABASE_URL=postgresql://...pooled Neon production url...
DIRECT_URL=postgresql://...direct Neon production url...
```

The Vercel build script uses `DIRECT_URL` for `prisma migrate deploy` when present, then runs `next build` with the normal environment.
