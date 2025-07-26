'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { detectUserRegion, getDefaultCurrency } from '@/lib/geolocation';

export default function AccommodationLink() {
  const [url, setUrl] = useState<string>('https://mountain-explorer.nuitee.link');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const setRegionAndCurrency = async () => {
      try {
        console.log('Starting region and currency detection...');
        // Get the region first
        const region = await detectUserRegion();
        console.log('Detected region:', region);
        
        // Then get the currency for that region
        const currency = await getDefaultCurrency(region);
        console.log('Using currency:', currency);
        
        // Construct the URL with region and currency parameters
        const baseUrl = process.env.NEXT_PUBLIC_Hotel_URL || 'https://mountain-explorer.nuitee.link';
        const url = new URL(baseUrl);
        
        // Add region and currency as query parameters
        // Ensure region is in the correct format (should be lowercase from detectUserRegion)
        url.searchParams.set('lang', region.toLowerCase());
        url.searchParams.set('currency', currency);
        
        console.log('Final accommodation URL:', url.toString());
        setUrl(url.toString());
      } catch (error) {
        console.error('Error setting up accommodation link:', error);
        // Fallback to default URL with default parameters if there's an error
        const fallbackUrl = new URL(process.env.NEXT_PUBLIC_Hotel_URL || 'https://mountain-explorer.nuitee.link');
        fallbackUrl.searchParams.set('lang', 'en');
        fallbackUrl.searchParams.set('currency', 'USD');
        console.log('Using fallback URL:', fallbackUrl.toString());
        setUrl(fallbackUrl.toString());
      } finally {
        setIsLoading(false);
      }
    };

    setRegionAndCurrency();
  }, []);

  if (isLoading) {
    return (
      <div className="relative group rounded-lg border border-gray-700 bg-gray-800/50 p-6">
        <div className="flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-full bg-gray-700 animate-pulse mb-4" />
          <div className="h-6 w-32 bg-gray-700 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-48 bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <Link 
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="relative group rounded-lg border border-gray-700 bg-gray-800/50 p-6 transition-all hover:bg-gray-800 hover:border-gray-600"
    >
      <div className="flex flex-col items-center text-center">
        <svg className="h-12 w-12 text-orange-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <rect x="3" y="16" width="18" height="1" rx="1" stroke="currentColor" strokeWidth="2"/>
          <rect x="10" y="8" width="9" height="5" rx="1" stroke="currentColor" strokeWidth="2"/>
          <circle cx="7" cy="11" r="2" stroke="currentColor" strokeWidth="2"/>
          <line x1="3" y1="7" x2="3" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <line x1="21" y1="15" x2="21" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <h2 className="text-2xl font-semibold text-white mb-2">Accommodation</h2>
        <p className="text-gray-400">
          Book accommodation through our partner site.
        </p>
      </div>
    </Link>
  );
}
