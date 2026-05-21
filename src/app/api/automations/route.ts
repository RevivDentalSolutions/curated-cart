import { NextResponse } from 'next/server';
import { getWeeklyChecklist, getContentCalendar } from '@/lib/automations';

export const dynamic = 'force-dynamic';

export async function GET() {
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
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
