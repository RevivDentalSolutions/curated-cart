import { redirect } from 'next/navigation';
import PinterestDashboard from '@/components/PinterestDashboard';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export default async function DashboardPinterestPage() {
  const isAuthenticated = await isAdminAuthenticated();

  if (!isAuthenticated) {
    redirect('/dashboard');
  }

  return <PinterestDashboard />;
}
