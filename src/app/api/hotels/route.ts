import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const latitude = searchParams.get('latitude');
  const longitude = searchParams.get('longitude');
  const radius = searchParams.get('radius') || '10000';
  
  console.log(`[API] Hotel request for lat=${latitude}, lng=${longitude}, radius=${radius}`);
  console.log('[API] Environment check:', {
    hasLiteApiKey: !!process.env.LITEAPI_KEY,
    hasPublicLiteApiKey: !!process.env.NEXT_PUBLIC_LITEAPI_KEY,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV
  });
  
  // For development, use a mock response if no API key is available
  const apiKey = process.env.LITEAPI_KEY || process.env.NEXT_PUBLIC_LITEAPI_KEY;
  
  if (!apiKey) {
    console.error('[API] No LiteAPI key found in environment variables');
    console.error('[API] Available env vars:', Object.keys(process.env).filter(key => key.includes('LITE')));
    
    // Return mock data for development
    return NextResponse.json({
      hotels: [
        {
          id: 'mock-hotel-1',
          name: 'Mountain View Hotel',
          address: '123 Mountain Road',
          city: 'Highland',
          country: 'Scotland',
          latitude: parseFloat(latitude || '0') + 0.01,
          longitude: parseFloat(longitude || '0') + 0.01,
          rating: 4.5,
          images: ['https://via.placeholder.com/150'],
          starRating: 4
        },
        {
          id: 'mock-hotel-2',
          name: 'Highland Lodge',
          address: '456 Valley Street',
          city: 'Highland',
          country: 'Scotland',
          latitude: parseFloat(latitude || '0') - 0.01,
          longitude: parseFloat(longitude || '0') - 0.01,
          rating: 4.2,
          images: ['https://via.placeholder.com/150'],
          starRating: 3
        }
      ]
    });
  }
  
  if (!latitude || !longitude) {
    return NextResponse.json(
      { error: 'Missing required parameters: latitude and longitude' },
      { status: 400 }
    );
  }
  
  try {
    // Match the exact order of parameters from the working curl command
    const apiUrl = `https://api.liteapi.travel/v3.0/data/hotels?longitude=${longitude}&latitude=${latitude}&radius=${radius}`;
    
    console.log(`[API] Fetching hotels from LiteAPI...`);
    console.log(`[API] Request URL: ${apiUrl}`);
    console.log(`[API] Using API key: ${apiKey ? apiKey.substring(0, 8) + '...' : 'NONE'}`);
    
    const response = await fetch(apiUrl, {
      headers: {
        'accept': 'application/json',
        'X-API-Key': apiKey
      }
    });
    
    console.log(`[API] Response status: ${response.status}`);
    console.log(`[API] Response headers:`, Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API] LiteAPI error (${response.status}):`, errorText);
      throw new Error(`Error from LiteAPI: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    // Log the structure of the response to understand what we're getting
    console.log('[API] Response structure:', {
      keys: Object.keys(data),
      dataType: typeof data,
      preview: JSON.stringify(data).substring(0, 200) + '...'
    });
    
    // Check for different possible response structures
    let hotels = [];
    
    // Based on the actual response structure we're seeing in the logs:
    // keys: [ 'data', 'hotelids', 'total' ]
    if (data.data && Array.isArray(data.data)) {
      console.log('[API] Found hotels in data array');
      // Log the first hotel object to see its structure
      if (data.data.length > 0) {
        console.log('[API] First hotel object structure:', data.data[0]);
      }
      
      // Extract hotels from the data array with detailed property mapping based on the exact structure
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hotels = data.data.map((hotel: any) => {
        // Log each hotel object to debug
        console.log('[API] Processing hotel:', hotel.name || 'Unknown');
        
        // Create a properly formatted hotel object
        return {
          id: hotel.id || `hotel-${Math.random().toString(36).substring(2, 10)}`,
          name: hotel.name || 'Unknown Hotel',
          address: hotel.address || '',
          city: hotel.city || '',
          country: hotel.country === 'gb' ? 'United Kingdom' : hotel.country || '',
          // Ensure latitude and longitude are numbers
          latitude: typeof hotel.latitude === 'number' ? hotel.latitude : parseFloat(hotel.latitude || '0'),
          longitude: typeof hotel.longitude === 'number' ? hotel.longitude : parseFloat(hotel.longitude || '0'),
          rating: parseFloat(hotel.rating || '0'),
          images: hotel.main_photo ? [hotel.main_photo] : [],
          // Use stars field for star rating
          starRating: parseFloat(hotel.stars || '0'),
          // Add additional useful fields from the API response
          description: hotel.hotelDescription || '',
          thumbnail: hotel.thumbnail || ''
        };
      });
    } else if (data.hotels && Array.isArray(data.hotels)) {
      // Standard structure we expect
      hotels = data.hotels;
    } else if (data.results && Array.isArray(data.results)) {
      // Another possible structure
      hotels = data.results;
    } else if (Array.isArray(data)) {
      // Direct array response
      hotels = data;
    }
    
    console.log(`[API] Successfully extracted ${hotels.length} hotels`);

    // Manually limit the number of hotels to 50, as the API does not support a limit parameter
    if (hotels.length > 50) {
      hotels = hotels.slice(0, 50);
      console.log(`[API] Returning ${hotels.length} hotels after applying limit`);
    }
    

    
    // Return the data in the expected format with hotels array
    return NextResponse.json({ hotels });
  } catch (error) {
    console.error('[API] Error fetching hotels from LiteAPI:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hotel data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
