'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { logger } from '@/lib/logger';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function executeRecaptcha(): Promise<string> {
    try {
      // Wait for reCAPTCHA to be ready
      await new Promise<void>((resolve) => {
        if (window.grecaptcha) {
          resolve();
        } else {
          // If grecaptcha is not available yet, wait for it
          window.addEventListener('grecaptchaLoaded', () => resolve(), { once: true });
        }
      });

      // Now that we're sure grecaptcha is available, execute it
      const token = await window.grecaptcha.execute(
        process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!,
        { action: 'login' }
      );

      if (!token) {
        throw new Error('No reCAPTCHA token received');
      }

      return token;
    } catch (error) {
      logger.error('Failed to execute reCAPTCHA:', error);
      throw new Error('Failed to verify you are human. Please try again.');
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;

      const captchaToken = await executeRecaptcha();

      const result = await signIn('credentials', {
        email,
        password,
        captchaToken,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      router.refresh();
      router.push('/');
    } catch (error) {
      logger.error('Login error:', error);
      toast.error('An error occurred during login');
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
          href="/"
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
          Back to Home
        </Link>

        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Sign in to your account
          </h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 bg-gray-800/50 text-gray-100 rounded-t-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm backdrop-blur-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 bg-gray-800/50 text-gray-100 rounded-b-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm backdrop-blur-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                href="/forgot-password"
                className="font-medium text-orange-400 hover:text-orange-300"
              >
                Forgot your password?
              </Link>
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
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-400">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-orange-400 hover:text-orange-300">
                Register
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
} 