import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest, unauthorizedAdminResponse } from '@/lib/admin-auth';
import { getScoutAutomationConfig, runScoutAutomation, updateScoutAutomationConfig } from '@/lib/scoutAutomation';

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorizedAdminResponse();

  try {
    const config = await getScoutAutomationConfig();
    return NextResponse.json({ success: true, data: config });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load scout automation settings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorizedAdminResponse();

  try {
    const body = await req.json();
    const config = await updateScoutAutomationConfig(body);
    return NextResponse.json({ success: true, data: config });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update scout automation settings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorizedAdminResponse();

  try {
    const result = await runScoutAutomation({ force: true });
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to run scout automation';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
