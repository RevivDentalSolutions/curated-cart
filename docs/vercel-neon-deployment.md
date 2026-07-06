# Vercel + Neon deployment notes

Curated Cart uses Prisma migrations for production schema changes. The Vercel build command runs:

```bash
prisma generate && node scripts/run-prisma-migrations-if-configured.mjs && next build
```

The migration runner executes `prisma migrate deploy` before `next build` whenever `DATABASE_URL` is configured. It intentionally does **not** run `prisma migrate dev` in production.

## Required Vercel environment variables

Set these in the Vercel project environment settings before redeploying:

- `DATABASE_URL`: Neon pooled PostgreSQL connection string used by the app and Prisma during deployment.
- `DIRECT_URL`: Neon direct PostgreSQL connection string. Keep this configured for Neon/Prisma operational tasks even though the current Prisma datasource only reads `DATABASE_URL`.
- `NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG`: Your active Amazon Associates tracking ID once approved.

After adding or correcting environment variables, redeploy from Vercel so `prisma migrate deploy` applies any pending files in `prisma/migrations/` before the Next.js build.
