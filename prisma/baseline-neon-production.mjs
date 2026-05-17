#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { PrismaClient } from '@prisma/client';

const DEFAULT_BASELINE_THROUGH = '20260516123000_ensure_blog_editor_fields';
const MIGRATIONS_DIR = path.join(process.cwd(), 'prisma', 'migrations');
const baselineThrough = process.env.BASELINE_THROUGH || DEFAULT_BASELINE_THROUGH;
const deployAfterBaseline = process.env.DEPLOY_AFTER_BASELINE !== 'false';

function run(command, args) {
  console.log(`\n$ ${[command, ...args].join(' ')}`);
  execFileSync(command, args, { stdio: 'inherit', env: process.env });
}

function migrationDirectories() {
  return readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

async function appliedMigrations(prisma) {
  try {
    const rows = await prisma.$queryRawUnsafe('SELECT migration_name FROM "_prisma_migrations" WHERE rolled_back_at IS NULL');
    return new Set(rows.map((row) => row.migration_name));
  } catch (error) {
    if (error?.code === 'P2010' || String(error?.message || '').includes('_prisma_migrations')) {
      return new Set();
    }

    throw error;
  }
}

async function migrationSummary(prisma) {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT migration_name, finished_at, rolled_back_at
    FROM "_prisma_migrations"
    ORDER BY started_at ASC
  `);

  return rows.map((row) => ({
    migration: row.migration_name,
    finishedAt: row.finished_at,
    rolledBackAt: row.rolled_back_at,
  }));
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required. Run this script only with the Neon production connection string available.');
  process.exit(1);
}

if (!process.env.DATABASE_URL.startsWith('postgres://') && !process.env.DATABASE_URL.startsWith('postgresql://')) {
  console.error('DATABASE_URL must point to PostgreSQL/Neon. Refusing to run against a non-PostgreSQL URL.');
  process.exit(1);
}

if (!existsSync(MIGRATIONS_DIR)) {
  console.error(`Migrations directory not found: ${MIGRATIONS_DIR}`);
  process.exit(1);
}

const migrations = migrationDirectories();
if (!migrations.includes(baselineThrough)) {
  console.error(`BASELINE_THROUGH migration not found: ${baselineThrough}`);
  console.error(`Available migrations:\n${migrations.join('\n')}`);
  process.exit(1);
}

const baselineIndex = migrations.indexOf(baselineThrough);
const migrationsToBaseline = migrations.slice(0, baselineIndex + 1);
const migrationsToDeploy = migrations.slice(baselineIndex + 1);

console.log('Prisma Neon production baseline plan');
console.log('-------------------------------------');
console.log(`Baseline through: ${baselineThrough}`);
console.log(`Migrations to mark applied: ${migrationsToBaseline.join(', ')}`);
console.log(`Migrations left for migrate deploy: ${migrationsToDeploy.length ? migrationsToDeploy.join(', ') : '(none)'}`);
console.log('This script never resets the database, drops tables, or deletes rows.');

run('npx', ['prisma', 'generate']);

const prisma = new PrismaClient();
try {
  await prisma.$connect();
  const before = await appliedMigrations(prisma);

  for (const migration of migrationsToBaseline) {
    if (before.has(migration)) {
      console.log(`\nAlready applied, skipping resolve: ${migration}`);
      continue;
    }

    run('npx', ['prisma', 'migrate', 'resolve', '--applied', migration]);
  }

  if (deployAfterBaseline) {
    run('npx', ['prisma', 'migrate', 'deploy']);
  } else {
    console.log('\nDEPLOY_AFTER_BASELINE=false, skipping prisma migrate deploy.');
  }

  const summary = await migrationSummary(prisma);
  console.log('\n_prisma_migrations summary:');
  for (const row of summary) {
    console.log(`- ${row.migration}: finished_at=${row.finishedAt?.toISOString?.() || row.finishedAt}, rolled_back_at=${row.rolledBackAt || 'null'}`);
  }

  console.log('\nBaseline complete. Existing application data was preserved; only Prisma migration history was baselined and pending migrations were deployed normally.');
} finally {
  await prisma.$disconnect();
}
