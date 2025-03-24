'use client';

import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useUser } from '@/context/UserContext';

export function UserAvatar() {
  const { data: session } = useSession();
  const { userName, userAvatar, isLoading, openProfileModal } = useUser();

  if (!session?.user) return null;

  console.log(userAvatar);

  return (
    <div 
      className="relative w-10 h-10 rounded-full cursor-pointer overflow-hidden hover:ring-2 hover:ring-orange-500/50 transition-all"
      onClick={openProfileModal}
    >
      {isLoading ? (
        <div className="w-full h-full bg-gray-700 animate-pulse" />
      ) : (
        <Image
          src={`/avatars/${userAvatar === "default" ? 'Avatar1.webp' : userAvatar}`}
          alt={`${userName}'s avatar`}
          fill
          sizes="(max-width: 768px) 40px, 40px"
          className="object-cover"
        />
      )}
    </div>
  );
} 