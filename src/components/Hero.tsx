'use client';

import React from 'react';
import { useSession } from 'next-auth/react';

export const Hero = () => {
  const { data: session } = useSession();

  return (
    <section 
      className="relative h-screen flex items-center justify-center"
      style={{
        backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url("/mountain-hero.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="text-center text-white z-10 px-4">
        {session?.user && (
          <div className="mb-8">
            <h2 className="text-4xl font-semibold">
              Welcome, {session.user.name || session.user.email}
            </h2>
          </div>
        )}
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          Discover UK&apos;s Majestic Mountains
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
        Explore the Majestic Mountains of the UK Embark on an unforgettable journey through the UK&apos;s most breathtaking peaks. 
        Track your progress as you conquer each climb, marking off your achievements along the way. 
        Celebrate your adventure by sharing your thoughts and rating the climb, inspiring others to take on the challenge
        </p>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
        Explore the Majestic Mountains of the UK Embark on an unforgettable journey through the UK&apos;s most breathtaking peaks. 
        </p>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto" >
        Track your progress as you conquer each climb and Celebrate your adventure by sharing your thoughts and rating the climb, inspiring others to take on the challenge
        </p>
        <a 
          href="#mountains"
          className="inline-block bg-white text-gray-900 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
        >
          Explore Mountains
        </a>
      </div>
    </section>
  );
}; 