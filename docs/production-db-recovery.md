# Production DB Recovery (Neon + Vercel + Prisma)

## What this fixes

If production throws:

`The column "image" does not exist in the current database.`

then Prisma schema and production DB schema are out of sync.

## 1) Verify Vercel environment variables are correct

Run from your local machine (with Vercel CLI authenticated):

```bash
vercel env ls
vercel env pull .env.production.local --environment=production
vercel env pull .env.preview.local --environment=preview
```

Compare `DATABASE_URL` values in `.env.production.local` and `.env.preview.local`.

- They should usually point to different Neon branches/databases.
- Confirm production points to the intended Neon production branch.

## 2) Check live DB schema directly (safe, read-only)

Use your production `DATABASE_URL` and inspect whether `Product.image` exists:

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'Product'
ORDER BY ordinal_position;
```

Also check migration history table:

```sql
SELECT migration_name, finished_at, rolled_back_at
FROM "_prisma_migrations"
ORDER BY finished_at DESC NULLS LAST;
```

## 3) Vercel build migrations

The Vercel build now runs pending Prisma migrations before `next build` whenever `DATABASE_URL` is configured.

Current build command:

```json
"build": "prisma generate && node scripts/run-prisma-migrations-if-configured.mjs && next build"
```

This uses `prisma migrate deploy` only. Do **not** use `prisma migrate dev` in production. If a pre-existing production database has broken migration history, baseline it first with `migrate resolve` as described below, then redeploy.

## 4) Manual SQL fallback (idempotent)

If migration history is broken but data must be preserved, apply:

```sql
ALTER TABLE "Product"
ADD COLUMN IF NOT EXISTS "image" TEXT;
```

## 5) Safe baseline strategy for an existing non-empty production DB

If `_prisma_migrations` is out of sync with a live Neon database, baseline it with `migrate resolve` instead of reset:

```bash
# 1) Ensure schema patch exists first (manual SQL from section 4)
# 2) Mark baseline migration as applied on production DB
DATABASE_URL="...production..." npx prisma migrate resolve --applied 20260522000000_add_product_image_column
```

After baselining, future migrations can be applied by the Vercel build or in controlled/manual runs:

```bash
DATABASE_URL="...production..." npx prisma migrate deploy
```

## 6) Post-fix verification

- Admin: create a product with `image` URL.
- API: `GET /api/products` returns existing rows.
- UI pages render previous products again.
- Confirm no Prisma errors in Vercel runtime logs.
- Confirm Vercel Production and Preview have different/intended `DATABASE_URL` values.

## Notes

- Do **not** run `prisma migrate reset` in production.
- Do **not** use `prisma db push --force-reset`, `DROP TABLE`, or destructive deletes in production recovery.
