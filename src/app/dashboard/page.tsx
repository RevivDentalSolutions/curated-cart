import { LockKeyhole } from 'lucide-react';
import AdminDashboard from '@/components/AdminDashboard';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { loginAdmin } from './actions';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const isAuthenticated = await isAdminAuthenticated();

  if (isAuthenticated) {
    return <AdminDashboard />;
  }

  const resolvedSearchParams = await searchParams;

  return (
    <div className="min-h-screen bg-brand-cream/50 flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md luxury-card p-8 md:p-10 text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand-blush/40 text-brand-gold">
          <LockKeyhole size={24} />
        </div>
        <span className="text-[10px] uppercase tracking-[0.3em] text-brand-gold font-bold">Private Studio</span>
        <h1 className="mt-4 text-4xl font-serif text-brand-black tracking-tighter">Admin Access Only</h1>
        <p className="mt-4 text-sm leading-relaxed text-brand-black/60">
          The tracker, weekly checklist, AI workflow tools, and internal content status are reserved for The Curated Cart team.
        </p>

        <form action={loginAdmin} className="mt-8 space-y-4 text-left">
          <label htmlFor="password" className="block text-[10px] uppercase font-bold tracking-widest text-brand-black/60">
            Dashboard Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded-sm border border-brand-blush bg-white px-4 py-3 text-sm text-brand-black focus:border-brand-gold focus:outline-none"
            placeholder="Enter admin password"
          />
          {resolvedSearchParams?.error && (
            <p className="text-xs text-red-700">That password did not match. Please try again.</p>
          )}
          <button type="submit" className="btn-primary w-full py-3">
            Enter Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}
