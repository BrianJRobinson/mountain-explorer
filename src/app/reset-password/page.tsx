'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { logger } from '@/lib/logger';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const token = searchParams.get('token');

  async function executeRecaptcha(): Promise<string> {
    try {
      return await new Promise((resolve, reject) => {
        if (!window.grecaptcha) {
          reject(new Error('reCAPTCHA not loaded'));
          return;
        }

        window.grecaptcha.ready(async () => {
          try {
            const token = await window.grecaptcha.execute(
              process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!,
              { action: 'reset_password' }
            );
            resolve(token);
          } catch (error) {
            reject(error);
          }
        });
      });
    } catch (error) {
      logger.error('Failed to execute reCAPTCHA:', error);
      throw new Error('Failed to execute reCAPTCHA');
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const password = formData.get('password') as string;
      const confirmPassword = formData.get('confirmPassword') as string;

      if (password !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      if (password.length < 8) {
        toast.error('Password must be at least 8 characters long');
        return;
      }

      if (!token) {
        toast.error('Reset token is missing');
        return;
      }

      const recaptchaToken = await executeRecaptcha();

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
          recaptchaToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      toast.success('Password has been reset successfully');
      router.push('/login');
    } catch (error) {
      logger.error('Password reset error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  }

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
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Enter your new password below
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="password" className="sr-only">
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 bg-gray-800/50 text-gray-100 rounded-t-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm backdrop-blur-sm"
                placeholder="New Password"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 bg-gray-800/50 text-gray-100 rounded-b-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm backdrop-blur-sm"
                placeholder="Confirm Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isLoading
                  ? 'bg-orange-500/50 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500'
              }`}
            >
              {isLoading ? 'Resetting password...' : 'Reset password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
} 