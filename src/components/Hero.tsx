'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useUser } from '@/context/UserContext';
import Image from 'next/image';

export const Hero = () => {
  const { data: session } = useSession();
  const { userName, userAvatar, isLoading } = useUser();

  return (
    <section 
      className="relative min-h-screen flex items-center justify-center py-16 md:py-0"
      style={{
        backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url("/mountain-hero.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="text-center text-white z-10 px-4 max-w-4xl mx-auto">
        {session?.user && (
          <div className="mb-6 md:mb-8 flex flex-col items-center">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-orange-500 overflow-hidden mb-3 md:mb-4 relative">
              {isLoading ? (
                <div className="w-full h-full bg-gray-700 animate-pulse" />
              ) : (
                <Image
                  src={`/avatars/${userAvatar === "default" ? 'Avatar1.webp' : userAvatar}`}
                  alt={`${userName}'s avatar`}
                  fill
                  sizes="(max-width: 768px) 64px, 80px"
                  className="object-cover"
                />
              )}
            </div>
            <h2 className="text-2xl md:text-4xl font-semibold">
              {isLoading ? (
                <span className="inline-block w-32 md:w-48 h-6 md:h-8 bg-gray-700 animate-pulse rounded"></span>
              ) : (
                <>Welcome, {userName}</>
              )}
            </h2>
          </div>
        )}
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6">
          Discover UK&apos;s Majestic Mountains
        </h1>
        <p className="text-lg md:text-xl lg:text-2xl mb-4 md:mb-8 max-w-2xl mx-auto">
          Embark on an unforgettable journey through the UK&apos;s most breathtaking peaks. 
        </p>
        <p className="text-lg md:text-xl lg:text-2xl mb-6 md:mb-8 max-w-2xl mx-auto" >
          Track your progress as you conquer each climb and celebrate your adventure by sharing your thoughts and rating the climb, inspiring others to take on the challenge
        </p>
        <a 
          href="#mountains"
          className="inline-block bg-white text-gray-900 px-6 md:px-8 py-2 md:py-3 rounded-lg text-base md:text-lg font-semibold hover:bg-gray-100 transition-colors"
        >
          Explore Mountains
        </a>
      </div>
    </section>
  );
}; 