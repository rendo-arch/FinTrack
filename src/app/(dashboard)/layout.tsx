import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/auth';
import DashboardShell from '@/components/layout/DashboardShell';
import { CurrencyProvider } from '@/components/providers/CurrencyProvider';
import { Toaster } from 'react-hot-toast';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    const cookieStore = await cookies();
    cookieStore.delete('fintrack-auth');
    redirect('/login');
  }

  return (
    <>
      <CurrencyProvider initialCurrency={user.currency}>
        <DashboardShell user={{ name: user.name, email: user.email }}>
          {children}
        </DashboardShell>
      </CurrencyProvider>
      <Toaster position="top-right" />
    </>
  );
}
