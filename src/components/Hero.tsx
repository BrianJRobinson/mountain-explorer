import React from 'react';

export const Hero = () => {
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
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          Discover UK&apos;s Majestic Mountains
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
          Explore detailed information about the United Kingdom&apos;s most beautiful peaks
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