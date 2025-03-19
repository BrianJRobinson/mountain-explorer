'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link');
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Verification failed');
        }

        setStatus('success');
        setMessage(data.message);

        // Redirect to login page after 3 seconds
        setTimeout(() => {
          router.push('/login?verified=true');
        }, 3000);
      } catch (error) {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Verification failed');
      }
    };

    verifyEmail();
  }, [router, searchParams]);

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundImage: 'url(/sign-in-tile-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="max-w-md w-full space-y-8 bg-gray-900/80 backdrop-blur-sm p-8 rounded-lg shadow-2xl border border-gray-700 relative">
        <Link
          href="/login"
          className="absolute -top-12 left-0 flex items-center text-gray-100 hover:text-orange-400 transition-colors group bg-gray-900/70 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-700 shadow-lg"
        >
          <svg 
            className="w-5 h-5 mr-2 group-hover:text-orange-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Login
        </Link>

        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Email Verification
          </h2>
        </div>

        {status === 'loading' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-300">Verifying your email...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded relative backdrop-blur-sm" role="alert">
            <span className="block sm:inline">{message}</span>
            <p className="mt-2 text-sm">Redirecting to login page...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded relative backdrop-blur-sm" role="alert">
            <span className="block sm:inline">{message}</span>
            <div className="mt-4 text-center">
              <Link
                href="/login"
                className="text-orange-400 hover:text-orange-300"
              >
                Return to login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
} 