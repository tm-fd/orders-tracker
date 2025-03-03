import { redirect } from 'next/navigation';
import { getSession } from "@/lib/getSession";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return <>{children}</>;
}