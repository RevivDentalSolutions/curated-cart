import { NextRequest, NextResponse } from 'next/server';
import { getScoutAutomationConfig, runScoutAutomation, updateScoutAutomationConfig } from '@/lib/scoutAutomation';

export async function GET() {
  try {
    const config = await getScoutAutomationConfig();
    return NextResponse.json({ success: true, data: config });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load scout automation settings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const config = await updateScoutAutomationConfig(body);
    return NextResponse.json({ success: true, data: config });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update scout automation settings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const result = await runScoutAutomation({ force: true });
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to run scout automation';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
