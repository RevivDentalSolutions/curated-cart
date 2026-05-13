import { NextRequest, NextResponse } from 'next/server';
import { getScoutAutomationConfig, runScoutAutomation, updateScoutAutomationConfig } from '@/lib/scoutAutomation';

export async function GET() {
  try {
    console.info('[Scout Automation API] Loading automation settings');
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
    console.info('[Scout Automation API] Saving automation settings', summarizeSettings(body));
    const config = await updateScoutAutomationConfig(body);
    return NextResponse.json({ success: true, data: config });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update scout automation settings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await readJsonBody(req);
    console.info('[Scout Automation API] Manual scout run requested', summarizeSettings(body?.config));
    const result = await runScoutAutomation({ force: true, config: body?.config });
    console.info('[Scout Automation API] Manual scout run completed', result);
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to run scout automation';
    console.error('[Scout Automation API] Manual scout run failed', { message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function readJsonBody(req: NextRequest) {
  try {
    return await req.json() as { config?: unknown };
  } catch {
    return undefined;
  }
}

function summarizeSettings(input: unknown) {
  if (!input || typeof input !== 'object') return { provided: false };
  const config = input as Record<string, unknown>;
  const count = (key: string) => Array.isArray(config[key]) ? config[key].length : 0;

  return {
    provided: true,
    autoImportEnabled: typeof config.autoImportEnabled === 'boolean' ? config.autoImportEnabled : undefined,
    rssFeeds: count('rssFeeds'),
    amazonMoversUrls: count('amazonMoversUrls'),
    tiktokKeywords: count('tiktokKeywords'),
    pinterestKeywords: count('pinterestKeywords'),
    productUrls: count('productUrls'),
  };
}
