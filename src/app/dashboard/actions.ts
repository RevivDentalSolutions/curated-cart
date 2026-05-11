'use server';

import { redirect } from 'next/navigation';
import { setAdminSession, verifyAdminPassword } from '@/lib/admin-auth';

export async function loginAdmin(formData: FormData) {
  if (!verifyAdminPassword(formData.get('password'))) {
    redirect('/dashboard?error=1');
  }

  await setAdminSession();
  redirect('/dashboard');
}
