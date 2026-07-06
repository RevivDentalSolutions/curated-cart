import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function isAuthorized(request: NextRequest) {
  const configuredToken = process.env.DATABASE_REPAIR_TOKEN;
  const providedToken = request.nextUrl.searchParams.get('token') || request.headers.get('x-repair-token');
  return Boolean(configuredToken && providedToken && providedToken === configuredToken);
}

type ColumnRow = { column_name: string; data_type: string; is_nullable: string };
type MigrationRow = { migration_name: string };

async function descriptionColumnExists() {
  const columns = await prisma.$queryRawUnsafe<ColumnRow[]>(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Product'
      AND column_name = 'description'
  `);
  return columns.length > 0;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Valid DATABASE_REPAIR_TOKEN required' }, { status: 401 });
  }

  const confirm = request.nextUrl.searchParams.get('confirm');
  if (confirm !== 'ADD_DESCRIPTION_COLUMN') {
    return NextResponse.json({
      success: false,
      error: 'Missing confirmation. Re-open this endpoint with confirm=ADD_DESCRIPTION_COLUMN to run the idempotent repair.',
      dryRun: true,
      sql: 'ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "description" TEXT;',
    }, { status: 400 });
  }

  try {
    const existedBefore = await descriptionColumnExists();
    await prisma.$executeRawUnsafe('ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "description" TEXT;');
    const existsAfter = await descriptionColumnExists();
    const descriptionMigrationRows = await prisma.$queryRawUnsafe<MigrationRow[]>(`
      SELECT migration_name
      FROM "_prisma_migrations"
      WHERE migration_name = '20260705000000_add_product_description'
    `).catch(() => [] as MigrationRow[]);

    return NextResponse.json({
      success: true,
      repair: {
        sql: 'ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "description" TEXT;',
        existedBefore,
        existsAfter,
        dataPreserved: true,
        destructiveCommandsUsed: false,
      },
      migrationHistory: {
        descriptionMigrationMarkedApplied: descriptionMigrationRows.length > 0,
        note: 'This endpoint only repairs the physical column. It does not mark Prisma migrations as applied.',
      },
      nextSteps: [
        'Re-open /api/admin/database-health with the same token and confirm productDescriptionExists is true.',
        'If migration history is not baselined, keep PRISMA_PRODUCTION_BASELINED unset and set PRISMA_SKIP_MIGRATE_DEPLOY=true temporarily so Vercel can deploy without running prisma migrate deploy.',
        'Only set PRISMA_PRODUCTION_BASELINED=true after migration history is actually baselined.',
        'Remove DATABASE_REPAIR_TOKEN after this one-time repair is complete.',
      ],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to repair Product.description column';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
