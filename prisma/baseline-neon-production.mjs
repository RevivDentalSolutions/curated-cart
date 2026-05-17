#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { PrismaClient } from '@prisma/client';

const DEFAULT_BASELINE_THROUGH = '20260510101950_init';
const MIGRATIONS_DIR = path.join(process.cwd(), 'prisma', 'migrations');
const baselineThrough = process.env.BASELINE_THROUGH || DEFAULT_BASELINE_THROUGH;
const deployAfterBaseline = process.env.DEPLOY_AFTER_BASELINE !== 'false';
const applicationTables = ['Category', 'Product', 'BlogPost', 'ContentBundle'];

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

async function migrationHistoryExists(prisma) {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT to_regclass('public."_prisma_migrations"') AS migration_table
  `);

  return Boolean(rows[0]?.migration_table);
}

async function existingApplicationTables(prisma) {
  const tableList = applicationTables.map((table) => `'${table.replaceAll("'", "''")}'`).join(', ');
  const rows = await prisma.$queryRawUnsafe(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name IN (${tableList})
    ORDER BY table_name
  `);

  return rows.map((row) => row.table_name);
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
console.log(`Migrations to mark applied if production is already populated: ${migrationsToBaseline.join(', ')}`);
console.log(`Migrations left for migrate deploy after baselining: ${migrationsToDeploy.length ? migrationsToDeploy.join(', ') : '(none)'}`);
console.log('This script never resets the database, drops tables, or deletes rows.');

run('npx', ['prisma', 'generate']);

const prisma = new PrismaClient();
try {
  await prisma.$connect();

  const hasMigrationHistory = await migrationHistoryExists(prisma);
  const existingTables = await existingApplicationTables(prisma);

  if (!hasMigrationHistory && existingTables.length === 0) {
    console.log('\nNo Prisma migration history or existing application tables were found. Running migrate deploy normally for a fresh database.');
  } else if (!hasMigrationHistory) {
    console.log(`\nNo Prisma migration history was found, but existing application tables are present: ${existingTables.join(', ')}`);
    console.log('Baselining the initial migration so Prisma does not attempt to recreate existing production tables.');

    const before = await appliedMigrations(prisma);
    for (const migration of migrationsToBaseline) {
      if (before.has(migration)) {
        console.log(`\nAlready applied, skipping resolve: ${migration}`);
        continue;
      }

      run('npx', ['prisma', 'migrate', 'resolve', '--applied', migration]);
    }
  } else {
    console.log('\nPrisma migration history already exists. Skipping baseline resolve and running migrate deploy normally.');
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
