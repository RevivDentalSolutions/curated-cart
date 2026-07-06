import { spawnSync } from 'node:child_process';

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

if (!hasDatabaseUrl) {
  console.warn('Skipping `prisma migrate deploy` because DATABASE_URL is not set. Configure DATABASE_URL in Vercel/production so migrations run before `next build`.');
  process.exit(0);
}

const result = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

process.exit(result.status ?? 1);
