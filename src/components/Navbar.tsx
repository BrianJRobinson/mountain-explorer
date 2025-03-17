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
            <div className="w-1/4">
              <Link href="/" className="text-white text-lg font-bold">
                Mountain Explorer
              </Link>
            </div>
            <div className="w-1/2 flex justify-end items-center">
              {session?.user ? (
                <span className="text-white text-sm sm:text-base truncate hidden md:block">
                  Welcome, {session.user.name || session.user.email}
                </span>
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
          
          {/* Bottom row - only shown when logged in */}
          {session?.user && (
            <div className="flex justify-end pb-2">
              <button
                onClick={() => signOut()}
                className="text-white hover:text-gray-300 transition-colors text-sm sm:text-base bg-gray-800/50 px-3 py-1 rounded"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}; 