# Vercel + Neon deployment notes

Curated Cart uses Prisma migrations for production schema changes. `vercel.json` points Vercel at a dedicated deployment build command:

```bash
npm run vercel-build
```

That script runs `prisma generate`, then `prisma migrate deploy`, then `next build`. It intentionally does **not** run `prisma migrate dev` in production. Local `npm run build` stays focused on `prisma generate && next build` so local builds do not silently depend on production database access.

## Required Vercel environment variables

Set these in the Vercel project environment settings before redeploying:

- `DATABASE_URL`: Neon pooled PostgreSQL connection string used by the app and Prisma during deployment.
- `DIRECT_URL`: Neon direct PostgreSQL connection string. The Vercel build script uses this for `prisma migrate deploy` when present, while the app can continue using the pooled `DATABASE_URL`.
- `PRISMA_PRODUCTION_BASELINED`: Set to `true` only after following `docs/neon-production-baseline.md` for an existing non-empty Neon production database.
- `NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG`: Your active Amazon Associates tracking ID once approved.

After baselining the existing production database and adding/correcting environment variables, redeploy from Vercel so `npm run vercel-build` applies only pending files in `prisma/migrations/` before the Next.js build.
