import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminRequest, unauthorizedAdminResponse } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const REPO_MIGRATIONS = [
  '20260510120000_add_product_leads',
  '20260510130000_add_scout_automation',
  '20260510143000_add_rainforest_product_fields',
  '20260510195500_add_product_image_url',
  '20260511120000_add_product_published',
  '20260511130000_add_blog_post_excerpt',
  '20260511143000_add_pinterest_pins',
  '20260515120000_unpublish_single_product_blog_posts',
  '20260520000000_init',
  '20260522000000_add_product_image_column',
  '20260524010000_add_admin_product_fields',
  '20260705000000_add_product_description',
];

function hasRepairToken(request: NextRequest) {
  const configuredToken = process.env.DATABASE_REPAIR_TOKEN;
  const providedToken = request.nextUrl.searchParams.get('token') || request.headers.get('x-repair-token');
  return Boolean(configuredToken && providedToken && providedToken === configuredToken);
}

function isAuthorized(request: NextRequest) {
  return isAdminRequest(request) || hasRepairToken(request);
}

type ColumnRow = { column_name: string; data_type: string; is_nullable: string };
type TableRow = { table_name: string };
type MigrationRow = { migration_name: string; finished_at: Date | null; rolled_back_at: Date | null };

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return unauthorizedAdminResponse();
  }

  try {
    const [tables, productColumns, migrationTable] = await Promise.all([
      prisma.$queryRawUnsafe<TableRow[]>(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
      `),
      prisma.$queryRawUnsafe<ColumnRow[]>(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Product'
        ORDER BY ordinal_position
      `),
      prisma.$queryRawUnsafe<TableRow[]>(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = '_prisma_migrations'
      `),
    ]);

    const migrationsTableExists = migrationTable.length > 0;
    const appliedMigrations = migrationsTableExists
      ? await prisma.$queryRawUnsafe<MigrationRow[]>(`
          SELECT migration_name, finished_at, rolled_back_at
          FROM "_prisma_migrations"
          ORDER BY finished_at NULLS LAST, migration_name
        `)
      : [];

    const appliedMigrationNames = appliedMigrations.map((migration) => migration.migration_name);
    const missingMigrationNames = REPO_MIGRATIONS.filter((migration) => !appliedMigrationNames.includes(migration));
    const productDescriptionExists = productColumns.some((column) => column.column_name === 'description');
    const productTableExists = tables.some((table) => table.table_name === 'Product');
    const canSetPrismaProductionBaselined = migrationsTableExists && missingMigrationNames.length === 0;

    return NextResponse.json({
      success: true,
      database: {
        hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
        productTableExists,
        productDescriptionExists,
        migrationsTableExists,
      },
      tables: tables.map((table) => table.table_name),
      productColumns,
      migrations: {
        repoMigrationNames: REPO_MIGRATIONS,
        appliedMigrationNames,
        missingMigrationNames,
        appliedMigrations,
      },
      recommendations: {
        repairDescriptionColumnUrl: productDescriptionExists ? null : '/api/admin/repair-description-column?confirm=ADD_DESCRIPTION_COLUMN&token=YOUR_DATABASE_REPAIR_TOKEN',
        canSetPrismaProductionBaselined,
        safeToSetPrismaProductionBaselinedWhen: 'Only set PRISMA_PRODUCTION_BASELINED=true after _prisma_migrations exists and all repo migrations are present in appliedMigrationNames, or after you intentionally baseline/resolve them.',
        cloudOnlyDeployFallback: productDescriptionExists && !canSetPrismaProductionBaselined
          ? 'Product.description exists, but migration history is still not fully baselined. Use PRISMA_SKIP_MIGRATE_DEPLOY=true as a temporary cloud-only deploy bypass until migration history is baselined.'
          : null,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to inspect database schema';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
