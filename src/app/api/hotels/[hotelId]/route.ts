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
    
    // Log the full structure of the response for debugging
    console.log('[API] Full LiteAPI Response:', JSON.stringify(data, null, 2));
    console.log('[API] Response structure:', {
      keys: Object.keys(data),
      dataType: typeof data,
      dataKeys: data.data ? Object.keys(data.data) : 'no data property'
    });
    
    // Process the hotel data from the API response
    // The exact structure will depend on the LiteAPI response format
    let hotelDetails;
    
    if (data.data && typeof data.data === 'object') {
      // Extract the hotel details from the data object
      const apiHotel = data.data;
      
      // Log available fields in the API response
      console.log('[API] Available fields in apiHotel:', Object.keys(apiHotel));
      
      // Map the API response to our hotel details structure with comprehensive field mapping
      hotelDetails = {
        id: hotelId,
        name: apiHotel.name || apiHotel.hotelName || 'Unknown Hotel',
        address: apiHotel.address || apiHotel.hotelAddress || '',
        city: apiHotel.city || apiHotel.hotelCity || '',
        country: apiHotel.country === 'gb' ? 'United Kingdom' : (apiHotel.country || apiHotel.hotelCountry || ''),
        latitude: (apiHotel.latitude && parseFloat(apiHotel.latitude) !== 0) ? parseFloat(apiHotel.latitude) : 
                 (apiHotel.lat && parseFloat(apiHotel.lat) !== 0) ? parseFloat(apiHotel.lat) : null,
        longitude: (apiHotel.longitude && parseFloat(apiHotel.longitude) !== 0) ? parseFloat(apiHotel.longitude) : 
                  (apiHotel.lng && parseFloat(apiHotel.lng) !== 0) ? parseFloat(apiHotel.lng) : null,
        rating: parseFloat(apiHotel.rating || apiHotel.hotelRating || '0'),
        images: (() => {
          // Handle hotelImages array from LiteAPI (objects with url/urlHd)
          if (apiHotel.hotelImages && Array.isArray(apiHotel.hotelImages)) {
            return apiHotel.hotelImages.map((img: any) => {
              if (typeof img === 'object' && img !== null) {
                // Prefer HD version if available, fallback to regular URL
                return img.urlHd || img.url || img.image;
              }
              return typeof img === 'string' ? img : null;
            }).filter(Boolean);
          }
          // Fallback to other image fields
          return apiHotel.images || 
                 (apiHotel.main_photo ? [apiHotel.main_photo] : []) ||
                 (apiHotel.photos ? apiHotel.photos : []) || [];
        })(),
        starRating: parseFloat(apiHotel.stars || apiHotel.starRating || apiHotel.star_rating || '0'),
        description: apiHotel.hotelDescription || 
                    apiHotel.description || 
                    apiHotel.hotel_description || 
                    apiHotel.overview || '',
        thumbnail: (() => {
          // Try to get thumbnail from hotelImages first
          if (apiHotel.hotelImages && Array.isArray(apiHotel.hotelImages) && apiHotel.hotelImages.length > 0) {
            const firstImage = apiHotel.hotelImages[0];
            if (typeof firstImage === 'object' && firstImage !== null) {
              return firstImage.url || firstImage.urlHd || firstImage.image;
            }
          }
          // Fallback to other thumbnail fields
          return apiHotel.thumbnail || 
                 apiHotel.main_photo || 
                 apiHotel.image || 
                 (apiHotel.images && apiHotel.images[0]) || '';
        })(),
        amenities: (() => {
          const rawAmenities = apiHotel.amenities || apiHotel.facilities || apiHotel.hotelAmenities || [];
          // Handle both string arrays and object arrays from LiteAPI
          if (Array.isArray(rawAmenities)) {
            return rawAmenities.map(amenity => {
              if (typeof amenity === 'string') {
                return amenity;
              } else if (typeof amenity === 'object' && amenity !== null) {
                // Handle objects with name, facilityName, or other name fields
                return amenity.name || amenity.facilityName || amenity.title || String(amenity);
              }
              return String(amenity);
            }).filter(Boolean); // Remove any empty/null values
          }
          return [];
        })(),
        checkInTime: apiHotel.checkInTime || 
                    apiHotel.check_in_time || 
                    apiHotel.checkin_time || '15:00',
        checkOutTime: apiHotel.checkOutTime || 
                     apiHotel.check_out_time || 
                     apiHotel.checkout_time || '11:00',
        email: apiHotel.email || apiHotel.hotelEmail || '',
        phone: apiHotel.phone || 
              apiHotel.telephone || 
              apiHotel.hotelPhone || 
              apiHotel.contact_number || '',
        website: apiHotel.website || 
                apiHotel.hotelWebsite || 
                apiHotel.url || '',
        // Additional fields that might be available
        chain: apiHotel.chain || apiHotel.hotelChain || '',
        brand: apiHotel.brand || apiHotel.hotelBrand || '',
        category: apiHotel.category || apiHotel.hotelCategory || '',
        // These fields might need to be fetched from a separate API call
        roomTypes: [],
        reviews: []
      };
      
      // Log the mapped hotel details
      console.log('[API] Mapped hotel details:', JSON.stringify(hotelDetails, null, 2));
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
