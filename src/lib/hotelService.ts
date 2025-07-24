import { useEffect, useState } from 'react';

export interface Hotel {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  rating: number;
  images: string[];
  price?: number;
  currency?: string;
  starRating?: number;
  // New fields from the API response
  description?: string;
  thumbnail?: string;
}

// Cache for storing hotel data to reduce API calls
const hotelCache = new Map<string, { data: Hotel[], timestamp: number }>();
const CACHE_EXPIRY = 1000 * 60 * 30; // 30 minutes

/**
 * Fetches hotels near a specific location
 * @param latitude Latitude of the center point
 * @param longitude Longitude of the center point
 * @param radius Radius in meters to search for hotels (default: 10000)
 * @returns Array of hotels
 */
export async function getHotelsNearby(latitude: number, longitude: number, radius: number = 10000): Promise<Hotel[]> {
  // Create a cache key based on the search parameters
  const cacheKey = `${latitude.toFixed(4)}_${longitude.toFixed(4)}_${radius}`;
  
  // Check if we have cached data that's still valid
  const cachedData = hotelCache.get(cacheKey);
  if (cachedData && (Date.now() - cachedData.timestamp < CACHE_EXPIRY)) {
    console.log('[hotelService] Returning cached hotel data');
    return cachedData.data;
  }
  
  // No need for API key here as it's handled by the server-side API route
  
  try {
    console.log(`[hotelService] Fetching hotels near ${latitude}, ${longitude} with radius ${radius}m`);
    
    // Use our Next.js API route as a proxy to avoid CORS issues
    const response = await fetch(`/api/hotels?latitude=${latitude}&longitude=${longitude}&radius=${radius}`);
    
    if (!response.ok) {
      throw new Error(`Error fetching hotels: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('[hotelService] API response structure:', {
      keys: Object.keys(data),
      hasHotels: 'hotels' in data,
      hotelsType: data.hotels ? typeof data.hotels : 'undefined',
      isArray: Array.isArray(data.hotels),
      responsePreview: JSON.stringify(data).substring(0, 200) + '...'
    });
    
    const hotels = data.hotels || [];
    
    // Cache the results
    hotelCache.set(cacheKey, { data: hotels, timestamp: Date.now() });
    
    console.log(`[hotelService] Found ${hotels.length} hotels`);
    return hotels;
  } catch (error) {
    console.error('[hotelService] Error fetching hotels:', error);
    return [];
  }
}

/**
 * React hook for fetching hotels near a location
 */
export function useHotelsNearby(lat: number, lng: number, radius: number = 10000, enabled: boolean = true) {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [fetchTrigger, setFetchTrigger] = useState(0); // To manually trigger refetch
  
  // Function to manually trigger a refetch
  const refetch = () => {
    console.log('[hotelService] Manually refetching hotels');
    setFetchTrigger(prev => prev + 1);
  };

  useEffect(() => {
    let isMounted = true;
    
    const fetchHotels = async () => {
      if (!lat || !lng || !enabled) {
        console.log('[useHotelsNearby] Not fetching hotels:', { lat, lng, enabled });
        return;
      }
      
      console.log('[useHotelsNearby] Fetching hotels:', { lat, lng, radius, enabled });
      setLoading(true);
      setError(null);
      
      try {
        const data = await getHotelsNearby(lat, lng, radius);
        console.log('[useHotelsNearby] Received hotel data:', { count: data.length, firstHotel: data[0] });
        if (isMounted) {
          setHotels(data);
        }
      } catch (err) {
        console.error('[useHotelsNearby] Error fetching hotels:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error fetching hotels'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchHotels();
    
    return () => {
      isMounted = false;
    };
  }, [lat, lng, radius, enabled, fetchTrigger]);
  
  return { hotels, loading, error, refetch };
}
