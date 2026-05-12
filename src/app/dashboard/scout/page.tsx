import { redirect } from 'next/navigation';
import ProductScoutClient from '@/components/ProductScoutClient';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export default async function ProductScoutPage() {
  const isAuthenticated = await isAdminAuthenticated();

  if (!isAuthenticated) {
    redirect('/dashboard');
  }

  return <ProductScoutClient />;
}
