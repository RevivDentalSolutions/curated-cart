import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

const ADMIN_COOKIE_NAME = 'curated_cart_admin';
const ADMIN_COOKIE_VALUE = 'authenticated';

export function verifyAdminPassword(password: FormDataEntryValue | null) {
  const configuredPassword = process.env.ADMIN_PASSWORD || 'curated-cart-admin';
  return typeof password === 'string' && password === configuredPassword;
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE_NAME)?.value === ADMIN_COOKIE_VALUE;
}

export async function setAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, ADMIN_COOKIE_VALUE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  });
}

export function isAdminRequest(request: NextRequest) {
  return request.cookies.get(ADMIN_COOKIE_NAME)?.value === ADMIN_COOKIE_VALUE;
}

export function unauthorizedAdminResponse() {
  return Response.json({ success: false, error: 'Admin access required' }, { status: 401 });
}
