'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect } from 'react';
import moment from 'moment';
import { Spinner } from "@heroui/react";

export default function AuthWrapper({ children }) {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;

    console.log( session?.user?.sessionExpires)

    if (!session?.user?.sessionExpires) return;
    
    const expirationMoment = moment(session.user.sessionExpires);
    const now = moment();
   console.log( expirationMoment.valueOf() - now.valueOf())
    if (now.isAfter(expirationMoment)) {
      signOut({ redirect: true, callbackUrl: '/signin' });
      return;
    }
    }, [session?.user?.sessionExpires, status]);

    if (status === 'loading') {
        return <Spinner color="secondary" size="xl" style={{ height: '50vh' }} />;
      }

  return <>{children}</>;
}