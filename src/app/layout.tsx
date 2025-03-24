import './global.css';
import Providers from './providers';
import Header from '@/components/Header';
import AuthWrapper from '@/components/AuthWrapper';
import { auth } from '@/auth';
import Layout from '@/components/Layout';
import HeaderWrapper from '@/components/HeaderWrapper';






export const metadata = {
  title: 'Order tracker - imvilabs',
  description: 'Created by  Tariq Mahrous',
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        sizes: '48x48',
      },
      {
        url: '/icon.png',
        sizes: '96x96',
      },
    ],
    apple: [
      {
        url: '/apple-icon.png',
        sizes: '180x180',
      },
    ],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <link rel="icon" type="image/png" href="/icon.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-icon" sizes="180x180" href="/apple-icon.png" />
      </head>
      <body className="h-screen">
        <Providers session={session}>
        <AuthWrapper>
          <HeaderWrapper />
          <Layout>{children}</Layout>
          <footer></footer>
          </AuthWrapper>
        </Providers>
      </body>
    </html>
  );
}
