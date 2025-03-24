import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import { ReCaptchaScript } from '@/components/ReCaptchaScript'
import { Footer } from '@/components/Footer'
import { CookieBanner } from '@/components/CookieBanner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Mountain Explorer',
  description: 'Discover and track your mountain adventures',
  icons: {
    icon: '/mountain.jpg',
    shortcut: '/mountain.jpg',
    apple: '/mountain.jpg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-900 text-gray-100 min-h-screen flex flex-col`}>
        <Providers>
          <div className="flex-grow">
            {children}
          </div>
          <Footer />
          <CookieBanner />
        </Providers>
        <ReCaptchaScript />
        <Toaster 
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1f2937',
              color: '#fff',
              border: '1px solid #374151',
            },
            success: {
              iconTheme: {
                primary: '#f97316',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  )
}
