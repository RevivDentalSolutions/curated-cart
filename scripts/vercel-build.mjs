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

const migrateEnv = {
  ...process.env,
  DATABASE_URL: process.env.DIRECT_URL || process.env.DATABASE_URL,
};

run('npx', ['prisma', 'migrate', 'deploy'], { env: migrateEnv });
run('npx', ['next', 'build']);
