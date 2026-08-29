import { spawnSync } from 'node:child_process';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run('npx', ['prisma', 'generate']);

if (!process.env.DATABASE_URL) {
  console.error('Vercel build is missing DATABASE_URL. Add the Neon production DATABASE_URL environment variable before deploying.');
  process.exit(1);
}

// Preview deployments must never run production migrations. The production
// baseline confirmation is intentionally scoped to the production deployment;
// requiring it in Preview prevents safe recovery branches from building.
if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
  console.log(`Skipping Prisma migrations for ${process.env.VERCEL_ENV} deployment.`);
  run('npx', ['next', 'build']);
  process.exit(0);
}

if (process.env.PRISMA_SKIP_MIGRATE_DEPLOY === 'true') {
  console.warn('Skipping prisma migrate deploy because PRISMA_SKIP_MIGRATE_DEPLOY=true. Use only as a temporary cloud-only bypass after confirming the production schema is already repaired.');
  run('npx', ['next', 'build']);
  process.exit(0);
}

const migrateEnv = {
  ...process.env,
  DATABASE_URL: process.env.DIRECT_URL || process.env.DATABASE_URL,
};

// Newsletter storage is an isolated, idempotent table addition. Apply it even
// while a legacy production database is waiting for its full Prisma baseline.
run('npx', [
  'prisma',
  'db',
  'execute',
  '--file',
  'prisma/migrations/20260829000000_add_newsletter_subscribers/migration.sql',
  '--schema',
  'prisma/schema.prisma',
], { env: migrateEnv });

if (process.env.PRISMA_PRODUCTION_BASELINED !== 'true') {
  // The production database already serves the live site. Do not block a
  // no-schema-change recovery release merely because its historic migration
  // ledger has not been baselined. Migrations remain disabled until the
  // baseline is explicitly confirmed in Vercel.
  console.warn('Prisma production baseline is not confirmed; skipping prisma migrate deploy and building against the existing production schema.');
  run('npx', ['next', 'build']);
  process.exit(0);
}

run('npx', ['prisma', 'migrate', 'deploy'], { env: migrateEnv });
run('npx', ['next', 'build']);
