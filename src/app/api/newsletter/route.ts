import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminRequest, unauthorizedAdminResponse } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorizedAdminResponse();

  try {
    const subscribers = await prisma.newsletterSubscriber.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: subscribers });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to load subscribers';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const source = body.source === 'homepage' || body.source === 'footer' ? body.source : 'website';

    // Quietly accept bot-filled honeypot submissions without storing them.
    if (typeof body.website === 'string' && body.website.trim()) {
      return NextResponse.json({ success: true, message: "You're on the list!" });
    }

    if (!EMAIL_PATTERN.test(email) || email.length > 254) {
      return NextResponse.json({ success: false, error: 'Enter a valid email address.' }, { status: 400 });
    }

    await prisma.newsletterSubscriber.upsert({
      where: { email },
      create: { email, source },
      update: {},
    });

    return NextResponse.json({ success: true, message: "You're on the list!" });
  } catch (error: unknown) {
    console.error('Newsletter signup error:', error);
    return NextResponse.json({ success: false, error: 'Unable to join right now. Please try again.' }, { status: 500 });
  }
}
