import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ hotelId: string }> }
) {
  const { hotelId } = await context.params;
  
  console.log(`[API] Hotel details request for hotelId=${hotelId}`);
  
  // For development, use a mock response if no API key is available
  const apiKey = process.env.LITEAPI_KEY || process.env.NEXT_PUBLIC_LITEAPI_KEY;
  
  if (!apiKey) {
    console.warn('[API] No LiteAPI key found in environment variables');
    
    // Return mock data for development
    return NextResponse.json({
      hotel: {
        id: hotelId,
        name: 'Mountain View Hotel',
        address: '123 Mountain Road',
        city: 'Highland',
        country: 'Scotland',
        latitude: 56.819817,
        longitude: -5.105218,
        rating: 4.5,
        images: [
          'https://via.placeholder.com/800x600?text=Hotel+Exterior',
          'https://via.placeholder.com/800x600?text=Hotel+Lobby',
          'https://via.placeholder.com/800x600?text=Hotel+Room',
          'https://via.placeholder.com/800x600?text=Hotel+Restaurant'
        ],
        thumbnail: 'https://via.placeholder.com/150?text=Hotel',
        starRating: 4,
        description: 'A beautiful hotel with stunning mountain views. Perfect for hikers and nature lovers.',
        amenities: ['Free WiFi', 'Restaurant', 'Bar', 'Fitness Center', 'Spa', 'Swimming Pool', 'Parking'],
        checkInTime: '15:00',
        checkOutTime: '11:00',
        email: 'info@mountainviewhotel.example',
        phone: '+44 1234 567890',
        website: 'https://www.mountainviewhotel.example',
        roomTypes: [
          {
            id: 'standard',
            name: 'Standard Room',
            description: 'Comfortable room with mountain view',
            maxOccupancy: 2,
            price: 120,
            currency: 'GBP',
            images: ['https://via.placeholder.com/800x600?text=Standard+Room']
          },
          {
            id: 'deluxe',
            name: 'Deluxe Room',
            description: 'Spacious room with panoramic mountain view',
            maxOccupancy: 2,
            price: 180,
            currency: 'GBP',
            images: ['https://via.placeholder.com/800x600?text=Deluxe+Room']
          },
          {
            id: 'suite',
            name: 'Mountain Suite',
            description: 'Luxury suite with separate living area and premium mountain view',
            maxOccupancy: 4,
            price: 250,
            currency: 'GBP',
            images: ['https://via.placeholder.com/800x600?text=Suite']
          }
        ],
        reviews: [
          {
            id: 'review1',
            author: 'John Doe',
            date: '2025-06-15',
            rating: 5,
            comment: 'Excellent hotel with amazing views and friendly staff.'
          },
          {
            id: 'review2',
            author: 'Jane Smith',
            date: '2025-06-10',
            rating: 4,
            comment: 'Great location and comfortable rooms. The restaurant was excellent.'
          },
          {
            id: 'review3',
            author: 'Robert Johnson',
            date: '2025-06-05',
            rating: 4.5,
            comment: 'Beautiful surroundings and very peaceful. Perfect for a hiking holiday.'
          }
        ]
      }
    });
  }
  
  try {
    // Reverted to v3.0 endpoint to fix 500 error, will rely on data merging for stars
    const apiUrl = `https://api.liteapi.travel/v3.0/data/hotel?hotelId=${hotelId}`;
    
    console.log(`[API] Fetching hotel details from LiteAPI...`);
    const response = await fetch(apiUrl, {
      headers: {
        'accept': 'application/json',
        'X-API-Key': apiKey
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API] LiteAPI error (${response.status}):`, errorText);
      throw new Error(`Error from LiteAPI: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    // Log the structure of the response
    console.log('[API] Response structure:', {
      keys: Object.keys(data),
      dataType: typeof data,
      preview: JSON.stringify(data).substring(0, 200) + '...'
    });
    
    // Process the hotel data from the API response
    // The exact structure will depend on the LiteAPI response format
    let hotelDetails;
    
    if (data.data && typeof data.data === 'object') {
      // Extract the hotel details from the data object
      const apiHotel = data.data;
      
      // Map the API response to our hotel details structure
      hotelDetails = {
        id: hotelId,
        name: apiHotel.name || 'Unknown Hotel',
        address: apiHotel.address || '',
        city: apiHotel.city || '',
        country: apiHotel.country === 'gb' ? 'United Kingdom' : apiHotel.country || '',
        latitude: (apiHotel.latitude && parseFloat(apiHotel.latitude) !== 0) ? parseFloat(apiHotel.latitude) : null,
        longitude: (apiHotel.longitude && parseFloat(apiHotel.longitude) !== 0) ? parseFloat(apiHotel.longitude) : null,
        rating: parseFloat(apiHotel.rating || '0'),
        images: apiHotel.images || (apiHotel.main_photo ? [apiHotel.main_photo] : []),
        starRating: parseFloat(apiHotel.stars || '0'),
        description: apiHotel.hotelDescription || apiHotel.description || '',
        thumbnail: apiHotel.thumbnail || '',
        amenities: apiHotel.amenities || [],
        checkInTime: apiHotel.checkInTime || '15:00',
        checkOutTime: apiHotel.checkOutTime || '11:00',
        email: apiHotel.email || '',
        phone: apiHotel.phone || '',
        website: apiHotel.website || '',
        // These fields might need to be fetched from a separate API call
        roomTypes: [],
        reviews: []
      };
    } else {
      console.error('[API] Unexpected response structure from LiteAPI');
      throw new Error('Unexpected response structure from LiteAPI');
    }
    
    console.log(`[API] Successfully processed hotel details for ${hotelDetails.name}`);
    
    // Return the processed hotel details
    return NextResponse.json({ hotel: hotelDetails });
  } catch (error) {
    console.error('[API] Error fetching hotel details from LiteAPI:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hotel details', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
