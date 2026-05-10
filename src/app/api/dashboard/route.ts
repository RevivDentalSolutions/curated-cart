import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest, unauthorizedAdminResponse } from '@/lib/admin-auth';
import { getDashboardStats } from '@/lib/dashboard';

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return unauthorizedAdminResponse();
  }

  try {
    const data = await getDashboardStats();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected API error' }, { status: 500 });
  }
}
