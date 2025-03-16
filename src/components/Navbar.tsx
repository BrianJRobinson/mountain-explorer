'use client';

import React from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export const Navbar = () => {
  const { data: session } = useSession();

  return (
    <nav className="fixed w-full z-50 bg-gray-900/30 backdrop-blur-md border-b border-gray-800/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-white text-xl font-bold">
              Mountain Explorer
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {session?.user ? (
              <>
                <span className="text-white">
                  Welcome, {session.user.name || session.user.email}
                </span>
                <button
                  onClick={() => signOut()}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="bg-orange-500 text-white shadow-lg transition-colors px-4 py-2 rounded-lg"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}; 