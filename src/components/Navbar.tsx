'use client';

import React from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export const Navbar = () => {
  const { data: session } = useSession();

  return (
    <nav className="fixed w-full z-50 bg-gray-900/30 backdrop-blur-md border-b border-gray-800/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col">
          {/* Top row */}
          <div className="flex items-center justify-between h-14">
            <div className="w-1/3">
              <Link href="/" className="text-white text-sm md:text-2xl font-bold flex items-center gap-2">
                <svg 
                  className="w-8 h-8 text-orange-500" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    d="M12 3L3 21H21L12 3Z" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  <path 
                    d="M12 3L7 14H17L12 3Z" 
                    fill="currentColor" 
                    fillOpacity="0.2"
                  />
                </svg>
                Mountain Explorer
              </Link>
            </div>
            <div className="w-1/2 flex justify-end items-center">
              {session?.user ? (
                  <button
                    onClick={() => signOut()}
                    className="bg-orange-500 text-white shadow-lg transition-colors px-3 py-1.5 rounded-lg text-sm sm:text-base"
                  >
                    Sign out
                  </button>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-white hover:text-gray-300 transition-colors text-sm sm:text-base mr-4 px-3 py-1.5"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className="bg-orange-500 text-white shadow-lg transition-colors px-3 py-1.5 rounded-lg text-sm sm:text-base"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </nav>
  );
}; 