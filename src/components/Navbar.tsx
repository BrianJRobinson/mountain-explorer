'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { UserAvatar } from './UserAvatar';
import { NotificationBell } from './shared/NotificationBell';
import { usePathname } from 'next/navigation';

export const Navbar = () => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed w-full z-50 bg-gray-900/30 backdrop-blur-md border-b border-gray-800/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col">
          {/* Top row */}
          <div className="flex items-center justify-between h-14">
            {/* Logo and Mobile Menu Button */}
            <div className="flex items-center gap-4">
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
                <span className="hidden sm:inline">Mountain Explorer</span>
              </Link>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="sm:hidden text-gray-300 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center gap-6">
              <Link
                href="/mountains"
                className={`text-sm font-medium transition-colors ${
                  isActive('/mountains')
                    ? 'text-orange-500'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Mountains
              </Link>
              <Link
                href="/walks"
                className={`text-sm font-medium transition-colors ${
                  isActive('/walks')
                    ? 'text-orange-500'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Walks
              </Link>
            </div>
            
            {/* User Actions */}
            <div className="flex items-center gap-4">
              {session?.user ? (
                <>
                  <NotificationBell />
                  <UserAvatar />
                  <button
                    onClick={() => signOut()}
                    className="bg-orange-500 text-white shadow-lg transition-colors px-3 py-1.5 rounded-lg text-sm sm:text-base"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-white hover:text-gray-300 transition-colors text-sm sm:text-base px-3 py-1.5"
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

          {/* Mobile Navigation Menu */}
          <div className={`sm:hidden ${isMenuOpen ? 'block' : 'hidden'} py-2`}>
            <Link
              href="/mountains"
              className={`block px-4 py-2 text-sm ${
                isActive('/mountains')
                  ? 'text-orange-500 bg-gray-800/50'
                  : 'text-gray-300 hover:bg-gray-800/30 hover:text-white'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Mountains
            </Link>
            <Link
              href="/walks"
              className={`block px-4 py-2 text-sm ${
                isActive('/walks')
                  ? 'text-orange-500 bg-gray-800/50'
                  : 'text-gray-300 hover:bg-gray-800/30 hover:text-white'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Walks
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}; 