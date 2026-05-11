import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest, unauthorizedAdminResponse } from '@/lib/admin-auth';
import { getWeeklyChecklist, getContentCalendar } from '@/lib/automations';

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return unauthorizedAdminResponse();
  }

  try {
    const checklist = await getWeeklyChecklist();
    const calendar = await getContentCalendar();

    return NextResponse.json({
      success: true,
      data: {
        checklist,
        calendar,
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected API error' }, { status: 500 });
  }
}
