import { NextRequest, NextResponse } from 'next/server';
import { runScoutAutomation } from '@/lib/scoutAutomation';

export async function GET(req: NextRequest) {
  const configuredSecret = process.env.SCOUT_CRON_SECRET;
  const suppliedSecret = req.nextUrl.searchParams.get('secret') || req.headers.get('x-cron-secret');

  if (configuredSecret && suppliedSecret !== configuredSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runScoutAutomation();
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to run scheduled scout';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
