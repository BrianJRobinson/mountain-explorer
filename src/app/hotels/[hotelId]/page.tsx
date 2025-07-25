'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { HotelDetails, RoomType, useHotelDetails, useHotelsNearby, Hotel } from '@/lib/hotelService';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import StarRating from '@/components/StarRating';
import HotelImageGallery from '@/components/Hotel/HotelImageGallery';
import styles from './HotelDetails.module.css';

// --- Helper Functions ---
const getTodayDate = () => new Date().toISOString().split('T')[0];
const getTomorrowDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};
const getDayAfterTomorrowDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d.toISOString().split('T')[0];
};

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

// Format distance based on locale (km for metric, miles for imperial)
const formatDistance = (distanceKm: number): string => {
  // Use navigator.language to detect locale, default to metric for most of the world
  const locale = typeof navigator !== 'undefined' ? navigator.language : 'en-GB';
  const useImperial = locale.startsWith('en-US'); // Only US uses miles primarily
  
  if (useImperial) {
    const distanceMiles = distanceKm * 0.621371; // Convert km to miles
    return `Within ${distanceMiles.toFixed(1)} miles`;
  } else {
    return `Within ${distanceKm.toFixed(1)} km`;
  }
};

// --- Nearby Hotels Sidebar Component ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NearbyHotels: React.FC<{ 
  hotels: Hotel[] | undefined, 
  loading: boolean, 
  error: any,
  referenceCoordinates?: { lat: number; lng: number }
}> = ({ hotels, loading, error, referenceCoordinates }) => {
  if (loading) return <div className="mt-8"><p>Loading nearby hotels...</p></div>;
  if (error) return <div className="mt-8"><p className="text-red-500">Error loading nearby hotels.</p></div>;
  if (!hotels || hotels.length === 0) return <div className="mt-8"><p>No nearby hotels found.</p></div>;

  // Limit to 3 rows of 5 columns (15 hotels)
  const displayedHotels = hotels.slice(0, 15);

  return (
    <div className="mt-12">
      <h2 className="text-3xl font-bold text-orange-600 mb-6">Nearby Hotels</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {displayedHotels.map(nearbyHotel => (
          <Link 
            href={`/hotels/${nearbyHotel.id}?lat=${nearbyHotel.latitude}&lng=${nearbyHotel.longitude}&stars=${nearbyHotel.starRating || 0}`} 
            key={nearbyHotel.id} 
            className="block border rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={nearbyHotel.thumbnail || 'https://via.placeholder.com/300x200?text=No+Image'} 
              alt={`Thumbnail for ${nearbyHotel.name}`} 
              className="w-full h-32 object-cover"
            />
            <div className="p-3 flex flex-col flex-grow">
              <h3 className="font-semibold text-md text-orange-600 truncate" title={nearbyHotel.name}>{nearbyHotel.name}</h3>
              <p className="text-sm text-gray-500 flex-grow">{nearbyHotel.city}</p>
              {/* Distance display for each nearby hotel */}
              {referenceCoordinates && nearbyHotel.latitude && nearbyHotel.longitude && (
                <p className="text-orange-400 text-xs mt-1 font-medium">
                  📍 {formatDistance(calculateDistance(
                    referenceCoordinates.lat,
                    referenceCoordinates.lng,
                    nearbyHotel.latitude,
                    nearbyHotel.longitude
                  ))}
                </p>
              )}
              <div className="mt-2 pt-2 border-t border-gray-100">
                {(nearbyHotel.starRating ?? 0) > 0 && (
                  <div className="text-yellow-500 flex items-center text-sm">
                    {'★'.repeat(Math.floor(nearbyHotel.starRating ?? 0))}
                  </div>
                )}
                {(nearbyHotel.rating ?? 0) > 0 && ( 
                  <div className="text-blue-600 font-bold text-sm mt-1">
                    {(nearbyHotel.rating ?? 0).toFixed(1)}
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

// --- Main Page Component ---
export default function HotelDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const hotelId = params.hotelId as string;
  const starsFromQuery = searchParams.get('stars');

  const { hotel, loading, error } = useHotelDetails(hotelId);

  // Get lat/lng from URL params as a fallback
  const urlLat = searchParams.get('lat');
  const urlLng = searchParams.get('lng');

  // Prioritize URL coordinates, then fall back to fetched hotel coordinates
  const latitude = urlLat ? parseFloat(urlLat) : hotel?.latitude;
  const longitude = urlLng ? parseFloat(urlLng) : hotel?.longitude;
  const hasValidCoordinates = !!latitude && !!longitude;

  const { nearbyHotels, loading: nearbyLoading, error: nearbyError } = useHotelsNearby(
    latitude ?? 0,
    longitude ?? 0,
    10000, // 10km radius
    // Enable only when not loading and we have coordinates from either URL or fetched data
    !loading && hasValidCoordinates,
    hotelId
  );

  if (!hotelId) return <ErrorState error={{ name: 'Error', message: 'Hotel ID is missing.' }} />;
  if (loading) return <LoadingState />;
  if (error || !hotel) return <ErrorState error={error} />;

  return (
    <div className="min-h-screen bg-[#0b1120] text-gray-300">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* --- Main Hotel Details --- */}
          <HotelDetailsContent 
            hotel={hotel} 
            starsFromQuery={starsFromQuery}
            referenceCoordinates={urlLat && urlLng ? { lat: parseFloat(urlLat), lng: parseFloat(urlLng) } : undefined}
          />

          {/* --- Nearby Hotels Section --- */}
          <div className="mt-12">
            {hasValidCoordinates ? (
              <NearbyHotels 
                hotels={nearbyHotels} 
                loading={nearbyLoading} 
                error={nearbyError}
                referenceCoordinates={urlLat && urlLng ? { lat: parseFloat(urlLat), lng: parseFloat(urlLng) } : undefined}
              />
            ) : (
              <div>
                <h2 className="text-3xl font-bold text-orange-600 mb-6">Nearby Hotels</h2>
                <p className="text-orange-600">Location data is not available for this hotel, so we cannot show nearby hotels.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Child Components ---

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
}

function HotelDetailsContent({ 
  hotel, 
  starsFromQuery, 
  referenceCoordinates 
}: { 
  hotel: HotelDetails; 
  starsFromQuery: string | null;
  referenceCoordinates?: { lat: number; lng: number };
}) {
  const [selectedDate, setSelectedDate] = useState({ checkIn: getTomorrowDate(), checkOut: getDayAfterTomorrowDate() });
  const [guests, setGuests] = useState({ adults: 2, children: 0 });

  // Debug logging for distance display
  console.log('Distance Debug:', {
    referenceCoordinates,
    hotelLat: hotel.latitude,
    hotelLng: hotel.longitude,
    hotelLatType: typeof hotel.latitude,
    hotelLngType: typeof hotel.longitude,
    hasReference: !!referenceCoordinates,
    hasHotelCoords: !!(hotel.latitude && hotel.longitude),
    hotelLatTruthy: !!hotel.latitude,
    hotelLngTruthy: !!hotel.longitude,
    hotelObject: hotel
  });

  const [availableRooms, setAvailableRooms] = useState<RoomType[]>([]);
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [hasSearchedRates, setHasSearchedRates] = useState(false);
  const [lowestPrice, setLowestPrice] = useState<number | null>(null);
  const [currency, setCurrency] = useState('USD');
  const [guestNationality, setGuestNationality] = useState('US');


  useEffect(() => {
    // This logic runs on the client-side after the component mounts.
    try {
      const userLocale = navigator.language; // e.g., 'en-AU', 'en-US', 'de-DE'
      const countryCode = userLocale.includes('-') ? userLocale.split('-')[1].toUpperCase() : 'US';
      const browserCurrency = new Intl.NumberFormat(userLocale).resolvedOptions().currency || 'USD';

      setGuestNationality(countryCode);
      setCurrency(browserCurrency);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      console.warn("Could not determine user's locale, defaulting to USD/US.");
      // Default values are already set, so we just log the warning.
    }
  }, []);

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
    // Reset availability when currency changes, to force a new search
    setAvailableRooms([]);
    setLowestPrice(null);
    setHasSearchedRates(false);
    setRatesError(null);
  };

  const handleCheckAvailability = async () => {
    setHasSearchedRates(true);
    if (!hotel) return;

    setIsFetchingRates(true);
    setRatesError(null);

    try {
      const response = await fetch(`/api/hotels/${hotel.id}/rates`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            checkin: selectedDate.checkIn,
            checkout: selectedDate.checkOut,
            adults: guests.adults,
            children: guests.children,
            currency,
            guestNationality,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch room rates.');
      }

      const data = await response.json();
      const rooms = data.availableRooms || [];
      setAvailableRooms(rooms);

      if (rooms.length > 0) {
        const prices = rooms
          .map((room: RoomType) => room.price)
          .filter((price: number | undefined): price is number => typeof price === 'number');
        
        if (prices.length > 0) {
          setLowestPrice(Math.min(...prices));
        } else {
          setLowestPrice(null);
        }
      } else {
        setLowestPrice(null);
      }

    } catch (error) {
      setRatesError(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
      setIsFetchingRates(false);
    }
  };



  const handleBookNowClick = () => {
    if (!hotel || !selectedDate.checkIn || !selectedDate.checkOut) return;

    const whitelabelBaseUrl = process.env.NEXT_PUBLIC_LITEAPI_WHITELABEL_URL;

    if (!whitelabelBaseUrl) {
      console.error('LiteAPI Whitelabel URL is not configured.');
      setRatesError('Booking service is not configured. Please contact support.');
      return;
    }

    const occupancies = [
      {
        adults: guests.adults,
        children: guests.children > 0 ? Array.from({ length: guests.children }, () => 10) : [], // Assuming age 10 for children as a placeholder
      },
    ];
    const encodedOccupancies = btoa(JSON.stringify(occupancies));

    const params = new URLSearchParams({
      checkin: selectedDate.checkIn,
      checkout: selectedDate.checkOut,
      rooms: '1',
      adults: guests.adults.toString(),
      children: guests.children.toString(),
      name: hotel.name,
      occupancies: encodedOccupancies,
      language: 'en',
      currency: currency,
    });

    // Ensure the base URL has a protocol, otherwise it's treated as a relative path.
    let fullWhitelabelUrl = whitelabelBaseUrl;
    if (!/^https?:\/\//i.test(fullWhitelabelUrl)) {
      fullWhitelabelUrl = `https://` + fullWhitelabelUrl;
    }

    const finalUrl = `${fullWhitelabelUrl}/hotels/${hotel.id}?${params.toString()}`;

    window.open(finalUrl, '_blank');
  };

  const handleContinueSearchClick = () => {
    const whitelabelBaseUrl = process.env.NEXT_PUBLIC_LITEAPI_WHITELABEL_URL;

    if (!whitelabelBaseUrl) {
      console.error('LiteAPI Whitelabel URL is not configured.');
      setRatesError('Booking service is not configured. Please contact support.');
      return;
    }

    // Try multiple common URL parameter formats for booking sites
    const params = new URLSearchParams({
      // Standard booking parameters
      checkin: selectedDate.checkIn,
      checkout: selectedDate.checkOut,
      adults: guests.adults.toString(),
      children: guests.children.toString(),
      rooms: '1',
      currency: currency,
      language: 'en',
      
      // Alternative parameter names that booking sites commonly use
      check_in: selectedDate.checkIn,
      check_out: selectedDate.checkOut,
      'checkin-date': selectedDate.checkIn,
      'checkout-date': selectedDate.checkOut,
      guests: guests.adults.toString(),
      room_count: '1',
    });

    // Add city/location parameters in multiple formats
    if (hotel.city) {
      params.set('name', hotel.city); // Primary location name parameter
      params.set('city', hotel.city);
      params.set('location', hotel.city);
      params.set('destination', hotel.city);
      params.set('q', hotel.city); // Common search query parameter
    }

    // Add coordinates if available for more precise location
    if (hotel.latitude && hotel.longitude) {
      params.set('lat', hotel.latitude.toString());
      params.set('lng', hotel.longitude.toString());
      params.set('longitude', hotel.longitude.toString());
      params.set('latitude', hotel.latitude.toString());
    }

    // Ensure the base URL has a protocol
    let fullWhitelabelUrl = whitelabelBaseUrl;
    if (!/^https?:\/\//i.test(fullWhitelabelUrl)) {
      fullWhitelabelUrl = `https://` + fullWhitelabelUrl;
    }

    // Use the base whitelabel URL with comprehensive search parameters
    const finalUrl = `${fullWhitelabelUrl}?${params.toString()}`;

    window.open(finalUrl, '_blank');
  };

  return (
    <div className="space-y-8">
      {/* Header Image & Title */}
      <div className="relative rounded-lg overflow-hidden bg-gray-800 h-96">
        {hotel.images && hotel.images.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hotel.images[0]} alt={hotel.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">No image available</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6">
          <h1 className="text-white text-4xl font-bold">{hotel.name}</h1>
          {hotel.city && (
            <p className="text-gray-200 text-lg mt-1">{hotel.city}</p>
          )}

          <div className="mt-2">
            {(() => {
              const starsFromUrl = starsFromQuery ? parseInt(starsFromQuery, 10) : 0;
              const displayStars = starsFromUrl > 0 ? starsFromUrl : (hotel.starRating ?? 0);

              return displayStars > 0 ? (
                <div className="text-yellow-400 flex items-center text-lg">
                  {'★'.repeat(displayStars)}
                </div>
              ) : null;
            })()}
            {(hotel.rating ?? 0) > 0 && (
              <div className="mt-1">
                <div className="bg-blue-500 text-white px-2 py-1 rounded text-sm font-bold inline-block">
                  {hotel.rating?.toFixed(1)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Width Image Gallery */}
      <div className="mb-8">
        <HotelImageGallery images={hotel.images || []} />
      </div>

      {/* Main Details & Booking Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* About Section */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-white mb-4">About this hotel</h2>
            <div className={`${styles.descriptionContainer} text-gray-400 space-y-4`} dangerouslySetInnerHTML={{ __html: hotel.description || '' }} />
          </div>

          {/* Amenities Section */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-white mb-4">Amenities</h2>
            {hotel.amenities && hotel.amenities.length > 0 ? (
              <div className={`max-h-64 overflow-y-auto pr-2 ${styles.amenitiesScrollContainer}`}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {hotel.amenities.map((amenity, i) => <div key={i} className="flex items-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>{amenity}</div>)}
                </div>
              </div>
            ) : <p className="text-gray-500">No amenities information available.</p>}
          </div>
        </div>

        {/* Booking Form */}
        <div className="md:col-span-1">
          <div className="bg-gray-800 p-6 rounded-lg sticky top-8">
            <h2 className="text-2xl font-bold text-white mb-4">Book Your Stay</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Check-in</label>
                <input type="date" value={selectedDate.checkIn} min={getTodayDate()} onChange={e => setSelectedDate(p => ({ ...p, checkIn: e.target.value }))} className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white focus:ring-orange-500 focus:border-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Check-out</label>
                <input type="date" value={selectedDate.checkOut} min={selectedDate.checkIn} onChange={e => setSelectedDate(p => ({ ...p, checkOut: e.target.value }))} className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white focus:ring-orange-500 focus:border-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Adults</label>
                <select value={guests.adults} onChange={e => setGuests(p => ({ ...p, adults: +e.target.value }))} className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white focus:ring-orange-500 focus:border-orange-500">
                  {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Children</label>
                <select value={guests.children} onChange={e => setGuests(p => ({ ...p, children: +e.target.value }))} className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white focus:ring-orange-500 focus:border-orange-500">
                  {[0, 1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Currency</label>
                <select value={currency} onChange={e => handleCurrencyChange(e.target.value)} className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white focus:ring-orange-500 focus:border-orange-500">
                  {['USD', 'AUD', 'EUR', 'GBP', 'CAD', 'JPY'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button onClick={handleCheckAvailability} disabled={isFetchingRates} className="w-full py-3 mt-2 rounded-md font-bold text-white transition-colors disabled:bg-gray-600 bg-orange-600 hover:bg-orange-700">
                {isFetchingRates ? 'Checking...' : 'Check Availability'}
              </button>

              {/* Continue Search Button - Always Visible */}
              <button 
                onClick={handleContinueSearchClick} 
                className="w-full py-3 mt-2 rounded-md font-bold text-white transition-colors bg-blue-600 hover:bg-blue-700 border border-blue-500">
                Continue Search on Partner Site
              </button>

              {ratesError && <p className="text-red-400 text-sm mt-2">Error: {ratesError}</p>}

              {hasSearchedRates && !isFetchingRates && availableRooms.length === 0 && !ratesError && (
                <div className="mt-4 p-4 bg-yellow-900/50 border border-yellow-500 rounded-lg text-center">
                  <p className="text-yellow-200">No rooms available for the selected dates. Please try different dates.</p>
                </div>
              )}

              {hasSearchedRates && !isFetchingRates && availableRooms.length > 0 && (
                <div className="mt-6 text-center">
                  <p className="text-lg font-semibold text-orange-400">
                    Good news! Rooms available
                    {lowestPrice !== null && ` from ${formatCurrency(lowestPrice, currency)} (${currency})`}
                  </p>
                  <button 
                    onClick={handleBookNowClick} 
                    className="mt-4 w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105">
                    Book Now on Partner Site
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



function LoadingState() {
  return (
    <div className="min-h-screen bg-[#0b1120] flex items-center justify-center">
      <div className="text-center text-gray-400">
        <svg className="animate-spin h-10 w-10 text-orange-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 text-lg">Loading hotel details...</p>
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: Error | null }) {
  return (
    <div className="min-h-screen bg-[#0b1120] flex items-center justify-center">
      <div className="text-center p-8 bg-gray-800 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Something went wrong</h2>
        <p className="text-gray-300 mb-6">{error?.message || 'Could not load hotel details.'}</p>
        <Link href="/" className="bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-500 transition-colors">
          Back to Map
        </Link>
      </div>
    </div>
  );
}
