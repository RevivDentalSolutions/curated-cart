# Cloud-only Product.description repair

Use this when you cannot run Prisma commands locally and production is blocked because `Product.description` is missing in Neon.

## Required temporary Vercel env vars

Because the current production build is intentionally blocked until the database is baselined, first set this temporary Production env var in Vercel so the repair endpoints can deploy without running `prisma migrate deploy`:

```text
PRISMA_SKIP_MIGRATE_DEPLOY=true
```

Then add two strong one-time secrets in Vercel Production environment variables:

```text
DATABASE_REPAIR_TOKEN=<long random secret>
DATABASE_REPAIR_CONFIRMATION=<different long random secret>
```

Remove `DATABASE_REPAIR_TOKEN` and `DATABASE_REPAIR_CONFIRMATION` after the repair is complete. Remove `PRISMA_SKIP_MIGRATE_DEPLOY` only after migration history has been safely baselined or Vercel will return to the baseline gate.

## 1) Inspect database health in the browser

Open this URL after deployment:

```text
https://YOUR_DOMAIN.com/api/admin/database-health?token=YOUR_DATABASE_REPAIR_TOKEN
```

The JSON report shows whether:

- `Product` exists.
- `Product.description` exists.
- `_prisma_migrations` exists.
- each repository migration is present in migration history.
- it is safe to set `PRISMA_PRODUCTION_BASELINED=true`.

## 2) Repair only the missing description column

If the health report says `productDescriptionExists` is `false`, open:

```text
https://YOUR_DOMAIN.com/api/admin/repair-description-column?confirm=ADD_DESCRIPTION_COLUMN&token=YOUR_DATABASE_REPAIR_TOKEN&oneTimeConfirmation=YOUR_DATABASE_REPAIR_CONFIRMATION
```

This runs only this idempotent SQL:

```sql
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "description" TEXT;
```

It does not delete data, reset the database, or mark migrations as applied. It also refuses to run after `Product.description` already exists, so it cannot be accidentally re-used after a successful repair.

## 3) Re-check health

Open the health URL again:

```text
https://YOUR_DOMAIN.com/api/admin/database-health?token=YOUR_DATABASE_REPAIR_TOKEN
```

Expected minimum result after repair:

```json
{
  "success": true,
  "database": {
    "productDescriptionExists": true
  }
}
```

## 4) Deploy safely while still cloud-only

If `productDescriptionExists` is `true` but `canSetPrismaProductionBaselined` is `false`, do **not** set `PRISMA_PRODUCTION_BASELINED=true` yet. Keep this temporary Vercel Production env var enabled:

```text
PRISMA_SKIP_MIGRATE_DEPLOY=true
```

Then redeploy. This skips `prisma migrate deploy` and runs `next build` after the schema has been repaired.

Only set this long-term flag after migration history is actually baselined:

```text
PRISMA_PRODUCTION_BASELINED=true
```

## 5) Disable repair access

After the site deploys and product creation works, remove this env var from Vercel:

```text
DATABASE_REPAIR_TOKEN
DATABASE_REPAIR_CONFIRMATION
```
