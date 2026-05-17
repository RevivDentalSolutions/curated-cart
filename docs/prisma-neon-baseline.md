# Neon Prisma Migration Baseline

This project uses Prisma Migrate. If the Neon PostgreSQL database already has The Curated Cart tables/data but does **not** have Prisma migration history, `prisma migrate deploy` can fail with:

```text
P3005: The database schema is not empty.
```

Do **not** reset, drop, or recreate the production database. Baseline the existing schema instead.

## Current baseline decision

The existing production database should be baselined through:

```text
20260516123000_ensure_blog_editor_fields
```

Those migrations represent the existing application schema before the `Elevated Summer` data-only migration. The following migration should be left for normal deployment unless the `Elevated Summer` category already exists in production:

```text
20260517120000_add_elevated_summer_category
```

That pending migration is safe and additive: it inserts the `Elevated Summer` category only when it does not already exist.

## One-time production command

Run this once with the Neon production `DATABASE_URL` available:

```bash
DATABASE_URL="postgresql://..." npm run prisma:baseline:neon
```

The script performs the official Prisma baseline workflow:

1. Runs `npx prisma generate`.
2. Marks existing migrations through `20260516123000_ensure_blog_editor_fields` as applied using `npx prisma migrate resolve --applied <migration_name>`.
3. Runs `npx prisma migrate deploy` so pending migrations can deploy normally.
4. Prints the `_prisma_migrations` rows so the baseline can be confirmed.

## Manual equivalent

If you prefer to run the commands manually, use this sequence with the production `DATABASE_URL` set:

```bash
npx prisma generate
npx prisma migrate resolve --applied 20260510101950_init
npx prisma migrate resolve --applied 20260510120000_add_product_leads
npx prisma migrate resolve --applied 20260510130000_add_scout_automation
npx prisma migrate resolve --applied 20260510143000_add_rainforest_product_fields
npx prisma migrate resolve --applied 20260510195500_add_product_image_url
npx prisma migrate resolve --applied 20260511120000_add_product_published
npx prisma migrate resolve --applied 20260511130000_add_blog_post_excerpt
npx prisma migrate resolve --applied 20260511143000_add_pinterest_pins
npx prisma migrate resolve --applied 20260515120000_unpublish_single_product_blog_posts
npx prisma migrate resolve --applied 20260516110000_add_blog_editor_fields
npx prisma migrate resolve --applied 20260516123000_ensure_blog_editor_fields
npx prisma migrate deploy
npm run build
```

## Safety notes

- Do not run `prisma migrate reset` against Neon production.
- Do not drop production tables.
- Do not delete or truncate production rows.
- `migrate resolve --applied` writes migration history only; it does not run the SQL in those migration files.
- Future Vercel builds can run `prisma migrate deploy` normally after `_prisma_migrations` is baselined.
