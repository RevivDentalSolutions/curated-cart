import { NextResponse } from 'next/server';
import { getDashboardStats } from '@/lib/dashboard';

export async function GET() {
  try {
    const data = await getDashboardStats();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
