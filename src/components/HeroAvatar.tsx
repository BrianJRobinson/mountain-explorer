'use client';

import Image from 'next/image';
import { useSession } from 'next-auth/react';

export const HeroAvatar = () => {
  const { data: session } = useSession();

  if (!session?.user) return null;

  return (
    <>
      <div className="flex justify-center mb-4">
        <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-orange-500 shadow-lg">
          <Image
            src={`/avatars/${session.user.avatar === "default" ? 'Avatar1.webp' : session.user.avatar || 'Avatar1.webp'}`}
            alt={session.user.name || 'User avatar'}
            fill
            style={{ objectFit: 'cover' }}
          />
        </div>
      </div>
      <h2 className="text-2xl font-semibold mb-8">
        Welcome, {session.user.name}
      </h2>
    </>
  );
}; 