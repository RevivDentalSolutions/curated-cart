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

## 3) Apply Prisma migrations safely (no reset)

This project now runs migrations during build via:

```json
"build": "prisma generate && prisma migrate deploy && next build"
```

You can also run it manually before deploy:

```bash
DATABASE_URL="...production..." npx prisma migrate deploy
```

## 4) Manual SQL fallback (idempotent)

If migration history is broken but data must be preserved, apply:

```sql
ALTER TABLE "Product"
ADD COLUMN IF NOT EXISTS "image" TEXT;
```

## 5) Post-fix verification

- Admin: create a product with `image` URL.
- API: `GET /api/products` returns existing rows.
- UI pages render previous products again.
- Confirm no Prisma errors in Vercel runtime logs.

## Notes

- Do **not** run `prisma migrate reset` in production.
- `prisma migrate deploy` is non-destructive and only applies pending migrations.
