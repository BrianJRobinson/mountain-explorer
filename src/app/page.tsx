/**
 * ⚠️ CRITICAL FILE - DO NOT MODIFY:
 * - Avatar handling
 * - User session fields
 * - Authentication logic
 */

import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
//import { getServerSession } from 'next-auth';
//import { authOptions } from './api/auth/auth-options';
import { HeroAvatar } from '@/components/HeroAvatar';

export default async function HomePage() {

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      
      {/* Hero Section */}
      <section 
        className="relative min-h-screen flex items-center justify-center pt-16 md:pt-0"
        style={{
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url("/mountain-hero.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="text-center text-white z-10 px-4 max-w-4xl mx-auto">
          <HeroAvatar />
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
            Explore The UK&apos;s Natural Beauty
          </h1>
          <p className="text-lg leading-8 text-gray-300 mb-16">
            Choose your adventure - discover the UK&apos;s majestic mountains or explore scenic walking routes.
          </p>

          {/* Dataset Selection Cards */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 max-w-5xl mx-auto">
            {/* Mountains Card */}
            <Link href="/mountains" 
                  className="relative group rounded-lg border border-gray-700 bg-gray-800/50 p-6 transition-all hover:bg-gray-800 hover:border-gray-600">
              <div className="flex flex-col items-center text-center">
                <svg className="h-12 w-12 text-blue-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <h2 className="text-2xl font-semibold text-white mb-2">Mountains</h2>
                <p className="text-gray-400">
                  Discover and track your progress climbing the UK&apos;s magnificent mountains.
                </p>
              </div>
            </Link>

            {/* Walks Card */}
            <Link href="/walks" 
                  className="relative group rounded-lg border border-gray-700 bg-gray-800/50 p-6 transition-all hover:bg-gray-800 hover:border-gray-600">
              <div className="flex flex-col items-center text-center">
                <svg className="h-12 w-12 text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <h2 className="text-2xl font-semibold text-white mb-2">Walks</h2>
                <p className="text-gray-400">
                  Explore scenic walking routes throughout the UK&apos;s beautiful landscapes.
                </p>
              </div>
            </Link>

            <Link href="/sites" 
                  className="relative group rounded-lg border border-gray-700 bg-gray-800/50 p-6 transition-all hover:bg-gray-800 hover:border-gray-600">
              <div className="flex flex-col items-center text-center">
                <svg className="h-12 w-12 text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <h2 className="text-2xl font-semibold text-white mb-2">Sites</h2>
                <p className="text-gray-400">
                  Explore some of the UK&apos;s most beautiful and historic sites.
                </p>
              </div>
            </Link>            
          </div>
        </div>
      </section>
    </div>
  );
} 