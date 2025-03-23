'use client';

import { SessionProvider } from 'next-auth/react';
import { UserProvider } from '@/context/UserContext';
import { ProfileModalProvider } from '@/components/ProfileModalContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <UserProvider>
        <ProfileModalProvider>
          {children}
        </ProfileModalProvider>
      </UserProvider>
    </SessionProvider>
  );
} 