import { useEffect, useState } from 'react';

// --- Helper Functions ---

/**
 * Deduplicates and merges a list of hotels. When duplicates are found (by ID),
 * it merges their properties, prioritizing non-empty/non-zero values.
 * @param hotels The raw array of hotels from the API.
 * @returns A clean, deduplicated array of hotels.
 */
/**
 * Calculates a "completeness" score for a hotel object.
 * The higher the score, the more complete the data.
 * @param hotel The hotel object.
 * @returns A numeric score.
 */
function calculateCompletenessScore(hotel: Hotel): number {
  let score = 0;
  if (hotel.description && hotel.description.length > 20) score += 2;
  if (hotel.thumbnail && hotel.thumbnail.length > 0) score += 2;
  if (hotel.images && hotel.images.length > 0) score += 1;
  if (hotel.starRating && hotel.starRating > 0) score += hotel.starRating;
  if (hotel.rating && hotel.rating > 0) score += 1;
  if (hotel.address && hotel.address.length > 0) score += 1;
  return score;
}

/**
 * Deduplicates and merges a list of hotels. When duplicates are found (by name and location),
 * it merges their properties, keeping the ID of the record deemed more "complete".
 * @param hotels The raw array of hotels from the API.
 * @returns A clean, deduplicated array of hotels.
 */
function deduplicateAndMergeHotels(hotels: Hotel[]): Hotel[] {
  const hotelMap = new Map<string, Hotel>();

  hotels.forEach(hotel => {
    const locationKey = `${hotel.name.toLowerCase().trim()}|${hotel.latitude.toFixed(3)}|${hotel.longitude.toFixed(3)}`;
    const existingHotel = hotelMap.get(locationKey);

    if (existingHotel) {
      const existingScore = calculateCompletenessScore(existingHotel);
      const newScore = calculateCompletenessScore(hotel);

      const winner = newScore > existingScore ? hotel : existingHotel;
      const loser = newScore > existingScore ? existingHotel : hotel;

      const mergedHotel: Hotel = { ...winner };

      // Fill in any gaps in the winner's data using the loser's data.
      (Object.keys(loser) as Array<keyof Hotel>).forEach(key => {
        if (mergedHotel[key] === null || mergedHotel[key] === undefined || (typeof mergedHotel[key] === 'number' && mergedHotel[key] === 0)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (mergedHotel as any)[key] = loser[key];
        }
      });

      hotelMap.set(locationKey, mergedHotel);
    } else {
      hotelMap.set(locationKey, hotel);
    }
  });

  return Array.from(hotelMap.values());
}

export interface Hotel {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  rating: number;
  images?: string[];
  price?: number;
  currency?: string;
  starRating?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rates?: any[];
  // New fields from the API response
  description?: string;
  thumbnail?: string;
}

export interface RoomType {
  id: string;
  offerId: string;
  name: string;
  description?: string;
  maxOccupancy: number;
  price?: number;
  currency?: string;
  images?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rates?: any[];
}

export interface HotelDetails extends Hotel {
  // Additional fields for detailed hotel view
  amenities?: string[];
  checkInTime?: string;
  checkOutTime?: string;
  email?: string;
  phone?: string;
  website?: string;
  roomTypes?: RoomType[];
  reviews?: Review[];
}

export interface Review {
  id: string;
  author: string;
  date: string;
  rating: number;
  comment: string;
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
export async function getHotelsNearby(latitude: number, longitude: number, radius: number = 10000, excludeHotelId?: string): Promise<Hotel[]> {
  // Create a cache key based on the search parameters
  const cacheKey = `${latitude.toFixed(4)}_${longitude.toFixed(4)}_${radius}`;
  
  // Check if we have cached data that's still valid
  const cachedData = hotelCache.get(cacheKey);
  if (cachedData && (Date.now() - cachedData.timestamp < CACHE_EXPIRY)) {
    // Returning cached hotel data
    return cachedData.data;
  }
  
  // No need for API key here as it's handled by the server-side API route
  
  try {
    // Fetching hotels from API
    
    // Use our Next.js API route as a proxy to avoid CORS issues
    const response = await fetch(`/api/hotels?latitude=${latitude}&longitude=${longitude}&radius=${radius}`);
    
    if (!response.ok) {
      throw new Error(`Error fetching hotels: ${response.status}`);
    }
    
    const data = await response.json();
    
    const rawHotels = data.hotels || [];
    const mergedHotels = deduplicateAndMergeHotels(rawHotels);

    const filteredHotels = excludeHotelId ? mergedHotels.filter((h: Hotel) => h.id !== excludeHotelId) : mergedHotels;
    
    // Cache the results
    hotelCache.set(cacheKey, { data: filteredHotels, timestamp: Date.now() });
    
    // Filtered hotels based on criteria
    return filteredHotels;
  } catch (error) {
    console.error('[hotelService] Error fetching hotels:', error);
    return [];
  }
}

/**
 * React hook for fetching hotels near a location
 */
/**
 * Fetches detailed information about a specific hotel by ID
 * @param hotelId The unique identifier of the hotel
 * @returns Detailed hotel information
 */
export async function getHotelDetails(hotelId: string): Promise<HotelDetails | null> {
  try {
    // Fetching hotel details from API
    
    // Use our Next.js API route as a proxy
    const response = await fetch(`/api/hotels/${hotelId}`);
    
    if (!response.ok) {
      throw new Error(`Error fetching hotel details: ${response.status}`);
    }
    
    const data = await response.json();
    // Received hotel details from API
    
    return data.hotel || null;
  } catch (error) {
    console.error('[hotelService] Error fetching hotel details:', error);
    return null;
  }
}

/**
 * React hook for fetching hotel details
 */
export function useHotelDetails(hotelId: string | null) {
  const [hotel, setHotel] = useState<HotelDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    
    const fetchHotelDetails = async () => {
      if (!hotelId) {
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const data = await getHotelDetails(hotelId);
        if (isMounted) {
          setHotel(data);
        }
      } catch (err) {
        console.error('[useHotelDetails] Error:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error fetching hotel details'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchHotelDetails();
    
    return () => {
      isMounted = false;
    };
  }, [hotelId]);
  
  return { hotel, loading, error };
}

export function useHotelsNearby(lat: number, lng: number, radius: number = 10000, enabled: boolean = true, excludeHotelId?: string) {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [fetchTrigger, setFetchTrigger] = useState(0); // To manually trigger refetch
  
  // Function to manually trigger a refetch
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const refetch = (newLat?: number, newLng?: number, newRadius?: number) => {
    // Manually refetching hotels
    // If new coordinates are provided, update the state before triggering the fetch
    if (newLat !== undefined && newLng !== undefined) {
      // This part is tricky because we can't directly set state and then fetch
      // in the same cycle. The fetch trigger is the primary mechanism.
      // The actual state update for lat/lng should happen in the component calling the hook.
      // The purpose here is to ensure the useEffect dependency check works.
      // A better approach is to handle the coordinate update in the component
      // and just use the trigger here. The logic will be in HotelMarkers.tsx
    }
    setFetchTrigger(prev => prev + 1);
  };

  useEffect(() => {
    let isMounted = true;
    
    const fetchHotels = async () => {
      if (!lat || !lng || !enabled) {
        // Not fetching hotels - conditions not met
        setHotels([]); // Clear hotels if fetching is disabled
        setLoading(false);
        return;
      }
      
      // Fetching hotels for coordinates
      setLoading(true);
      setError(null);
      
      try {
        const data = await getHotelsNearby(lat, lng, radius, excludeHotelId);
        // Received hotel data from API
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
  }, [lat, lng, radius, enabled, fetchTrigger, excludeHotelId]);
  
  return { nearbyHotels: hotels, loading, error, refetch };
}
