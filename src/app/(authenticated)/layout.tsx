// src/app/(authenticated)/layout.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/navigation/Sidebar';
import NavigationBar from '@/components/notifications/NavigationBar';
import { ClientLayoutWrapper } from '@/components/navigation/ClientLayoutWrapper';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/signin');
  }

  return (
    <div className="flex min-h-screen py-9 bg-background">
      <Sidebar />
      <ClientLayoutWrapper>
        <div className="flex flex-col flex-1">
          <NavigationBar user={session.user} />
          <main className="flex-1 p-6 overflow-x-hidden">
            {children}
          </main>
        </div>
      </ClientLayoutWrapper>
    </div>
  );
}