'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { detectUserRegion, getDefaultCurrency } from '@/lib/geolocation';
import { HotelDetails, RoomType, useHotelDetails, useHotelsNearby, Hotel } from '@/lib/hotelService';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import StarRating from '@/components/StarRating';
import HotelImageGallery from '@/components/Hotel/HotelImageGallery';
import { loadBookingDetails, updateBookingDetails, getDefaultBookingDetails } from '@/lib/bookingContext';
import styles from './HotelDetails.module.css';

// Calendar helper functions
const getDaysInMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

const getFirstDayOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
};

const formatDateForDisplay = (dateStr: string) => {
  // Parse date string as local date to avoid timezone issues
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day); // month is 0-indexed
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
};

const isSameDay = (date1: string, date2: string) => {
  return date1 === date2;
};

const isDateInRange = (date: string, startDate: string, endDate: string) => {
  return date >= startDate && date <= endDate;
};

const isDateDisabled = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
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

// Format distance based on detected user region
const formatDistance = async (distanceKm: number): Promise<string> => {
  const region = (await detectUserRegion()).toUpperCase();
  
  console.log('Detected region:', region);

  // Countries that primarily use miles (Imperial system)
  const imperialCountries = ['US', 'LR', 'MM']; // USA, Liberia, Myanmar
  // UK uses miles for distance but km for shorter measurements - we'll use miles for consistency
  const ukCountries = ['GB', 'UK'];
  
  const useImperial = imperialCountries.includes(region) || ukCountries.includes(region);
  
  if (useImperial) {
    const distanceMiles = distanceKm * 0.621371; // Convert km to miles
    return `Within ${distanceMiles.toFixed(1)} miles`;
  } else {
    return `Within ${distanceKm.toFixed(1)} km`;
  }
};

// React component to handle async distance formatting
const DistanceDisplay: React.FC<{ 
  distanceKm: number; 
  className?: string 
}> = ({ distanceKm, className = '' }) => {
  const [formattedDistance, setFormattedDistance] = useState<string>('');

  useEffect(() => {
    const format = async () => {
      const formatted = await formatDistance(distanceKm);
      setFormattedDistance(formatted);
    };
    
    format();
  }, [distanceKm]);

  return <span className={className}>{formattedDistance || '...'}</span>;
};

// --- Nearby Hotels Sidebar Component ---
const NearbyHotels: React.FC<{ 
  hotels: Hotel[] | undefined, 
  loading: boolean, 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any,
  referenceCoordinates?: { lat: number; lng: number }
}> = ({ hotels, loading, error, referenceCoordinates }) => {
  if (loading) return <div className="mt-8"><p>Loading nearby hotels...</p></div>;
  if (error) return <div className="mt-8"><p className="text-red-500">Error loading nearby hotels.</p></div>;
  if (!hotels || hotels.length === 0) return <div className="mt-8"><p>No nearby hotels found.</p></div>;

  // Get current booking details to preserve in nearby hotel links
  const currentBooking = loadBookingDetails();
  
  // Limit to 3 rows of 5 columns (15 hotels)
  const displayedHotels = hotels.slice(0, 15);

  return (
    <div className="mt-12">
      <h2 className="text-3xl font-bold text-orange-600 mb-6">Nearby Hotels</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {displayedHotels.map(nearbyHotel => (
          <Link 
            href={`/hotels/${nearbyHotel.id}?lat=${nearbyHotel.latitude}&lng=${nearbyHotel.longitude}&stars=${nearbyHotel.starRating || 0}&checkIn=${currentBooking.checkIn}&checkOut=${currentBooking.checkOut}&adults=${currentBooking.adults}&children=${currentBooking.children}`} 
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
                  <DistanceDisplay 
                    distanceKm={calculateDistance(
                      referenceCoordinates.lat,
                      referenceCoordinates.lng,
                      nearbyHotel.latitude,
                      nearbyHotel.longitude
                    )}
                  />
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
    50000, // 50km radius (increased from 10km to find more hotels)
    // Enable only when not loading and we have coordinates from either URL or fetched data
    !loading && hasValidCoordinates,
    hotelId // exclude current hotel from results
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
  const searchParams = useSearchParams();
  
  // Initialize state with default values (lazy load booking context later)
  const [selectedDate, setSelectedDate] = useState(() => {
    const defaults = getDefaultBookingDetails();
    return { checkIn: defaults.checkIn, checkOut: defaults.checkOut };
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [tempSelectedDates, setTempSelectedDates] = useState<string[]>([]);
  const [guests, setGuests] = useState(() => {
    const defaults = getDefaultBookingDetails();
    return { adults: defaults.adults, children: defaults.children };
  });

  // Lazy load booking details to prevent localStorage interference with map popup
  useEffect(() => {
    console.log('🏨 [HOTEL DEBUG] Lazy loading booking details...');
    const booking = loadBookingDetails();
    
    // Only update state if values are different from defaults
    const defaults = getDefaultBookingDetails();
    if (booking.checkIn !== defaults.checkIn || booking.checkOut !== defaults.checkOut) {
      console.log('🏨 [HOTEL DEBUG] Updating selectedDate from localStorage:', { checkIn: booking.checkIn, checkOut: booking.checkOut });
      setSelectedDate({ checkIn: booking.checkIn, checkOut: booking.checkOut });
    }
    
    if (booking.adults !== defaults.adults || booking.children !== defaults.children) {
      console.log('🏨 [HOTEL DEBUG] Updating guests from localStorage:', { adults: booking.adults, children: booking.children });
      setGuests({ adults: booking.adults, children: booking.children });
    }
    
  }, []); // Only run once on mount

  // Initialize from URL parameters if provided (e.g., from nearby hotel links)
  useEffect(() => {
    console.log('🔗 [HOTEL DEBUG] Checking URL parameters for booking details...');
    const urlCheckIn = searchParams.get('checkIn');
    const urlCheckOut = searchParams.get('checkOut');
    const urlAdults = searchParams.get('adults');
    const urlChildren = searchParams.get('children');
    
    console.log('🔗 [HOTEL DEBUG] URL parameters found:', {
      urlCheckIn,
      urlCheckOut,
      urlAdults,
      urlChildren,
      hasAnyParams: !!(urlCheckIn || urlCheckOut || urlAdults || urlChildren)
    });
    
    if (urlCheckIn || urlCheckOut || urlAdults || urlChildren) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updates: any = {};
      
      if (urlCheckIn) {
        console.log('🔗 [HOTEL DEBUG] Setting checkIn from URL:', urlCheckIn);
        setSelectedDate(prev => ({ ...prev, checkIn: urlCheckIn }));
        updates.checkIn = urlCheckIn;
      }
      if (urlCheckOut) {
        console.log('🔗 [HOTEL DEBUG] Setting checkOut from URL:', urlCheckOut);
        setSelectedDate(prev => ({ ...prev, checkOut: urlCheckOut }));
        updates.checkOut = urlCheckOut;
      }
      if (urlAdults) {
        const adults = parseInt(urlAdults, 10);
        if (!isNaN(adults)) {
          console.log('🔗 [HOTEL DEBUG] Setting adults from URL:', adults);
          setGuests(prev => ({ ...prev, adults }));
          updates.adults = adults;
        }
      }
      if (urlChildren) {
        const children = parseInt(urlChildren, 10);
        if (!isNaN(children)) {
          console.log('🔗 [HOTEL DEBUG] Setting children from URL:', children);
          setGuests(prev => ({ ...prev, children }));
          updates.children = children;
        }
      }
      
      // Save the URL parameters to booking context
      if (Object.keys(updates).length > 0) {
        console.log('🔗 [HOTEL DEBUG] Updating booking context with URL params:', updates);
        updateBookingDetails(updates);
      }
    } else {
      console.log('🔗 [HOTEL DEBUG] No URL parameters found, using existing booking context');
    }
  }, [searchParams]);

  // Save booking details whenever they change
  useEffect(() => {
    const currentDetails = {
      checkIn: selectedDate.checkIn,
      checkOut: selectedDate.checkOut,
      adults: guests.adults,
      children: guests.children
    };
    
    console.log('💾 [HOTEL DEBUG] Auto-saving booking details due to state change:', {
      currentDetails,
      timestamp: new Date().toISOString(),
      url: window.location.href
    });
    
    updateBookingDetails(currentDetails);
  }, [selectedDate.checkIn, selectedDate.checkOut, guests.adults, guests.children]);

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
    // Use hybrid region detection to set currency and nationality
    const initializeLocaleSettings = async () => {
      try {
        const detectedRegion = await detectUserRegion();
        const defaultCurrency = await getDefaultCurrency(detectedRegion);
        
        console.log('Initializing locale settings:', { detectedRegion, defaultCurrency });
        
        setGuestNationality(detectedRegion);
        setCurrency(defaultCurrency);
        
      } catch (error) {
        console.warn("Could not determine user's region, defaulting to USD/US:", error);
        setGuestNationality('US');
        setCurrency('USD');
      }
    };
    
    initializeLocaleSettings();
  }, []);

  // Calendar date handling functions
  const handleDateClick = (dateStr: string) => {
    if (isDateDisabled(dateStr)) return;
    
    if (tempSelectedDates.length === 0) {
      // First click - select first date
      setTempSelectedDates([dateStr]);
    } else if (tempSelectedDates.length === 1) {
      // Second click - determine check-in and check-out based on chronological order
      const firstDate = tempSelectedDates[0];
      const secondDate = dateStr;
      
      if (firstDate === secondDate) {
        // Same date clicked twice, reset
        setTempSelectedDates([dateStr]);
        return;
      }
      
      // Automatically assign check-in (earlier) and check-out (later)
      const checkIn = firstDate <= secondDate ? firstDate : secondDate;
      const checkOut = firstDate <= secondDate ? secondDate : firstDate;
      
      setSelectedDate({ checkIn, checkOut });
      setTempSelectedDates([]);
      setIsCalendarOpen(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCalendarMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const openCalendar = () => {
    setIsCalendarOpen(true);
    setTempSelectedDates([]); // Clear any temporary selections
    // Set calendar to show the month of the current check-in date
    setCalendarMonth(new Date(selectedDate.checkIn));
  };

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

    console.log("Hotel Details: " + hotel);

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

    console.log("Hotel Details: " + hotel);

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
      guests: guests.adults.toString(),
      room_count: '1',
    });

    // Add coordinates if available for more precise location
    // Use hotel coordinates if available, otherwise fall back to referenceCoordinates
    const lat = hotel.latitude ?? referenceCoordinates?.lat;
    const lng = hotel.longitude ?? referenceCoordinates?.lng;
    
    if (lat && lng) {
      // Also add as placeId parameter if needed by the partner site
      params.set('placeId', `${lat},${lng}`);
    }

    // Ensure the base URL has a protocol
    let fullWhitelabelUrl = whitelabelBaseUrl;
    if (!/^https?:\/\//i.test(fullWhitelabelUrl)) {
      fullWhitelabelUrl = `https://` + fullWhitelabelUrl;
    }

    // Use the base whitelabel URL with comprehensive search parameters
    const finalUrl = `${fullWhitelabelUrl}/hotels?${params.toString()}`;

    window.open(finalUrl, '_blank');
  };

  {console.log(hotel)};

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
              {/* Date Range Selector */}
              <div className="relative w-full">
                <label className="block text-sm font-medium text-gray-400 mb-1">Dates</label>
                <button
                  onClick={openCalendar}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-left hover:bg-gray-600 transition-colors duration-150 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <div className="text-white font-medium">
                        {formatDateForDisplay(selectedDate.checkIn)} - {formatDateForDisplay(selectedDate.checkOut)}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {(() => {
                          const checkIn = new Date(selectedDate.checkIn);
                          const checkOut = new Date(selectedDate.checkOut);
                          const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
                          return `${nights} night${nights !== 1 ? 's' : ''}`;
                        })()}
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </button>

                {/* Calendar Popup */}
                {isCalendarOpen && (
                  <div className="absolute top-full left-0 mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-2xl z-50 p-4 w-80">
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => navigateMonth('prev')}
                        className="p-1 hover:bg-gray-700 rounded transition-colors"
                      >
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      
                      <h3 className="text-white font-medium">
                        {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </h3>
                      
                      <button
                        onClick={() => navigateMonth('next')}
                        className="p-1 hover:bg-gray-700 rounded transition-colors"
                      >
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>

                    {/* Selection Status */}
                    <div className="mb-3 text-center">
                      <div className="text-xs text-gray-400">
                        {tempSelectedDates.length === 0 ? 'Select your dates' : tempSelectedDates.length === 1 ? 'Select end date' : 'Dates selected'}
                      </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {/* Day Headers */}
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                        <div key={day} className="text-center text-xs text-gray-500 py-2 font-medium">
                          {day}
                        </div>
                      ))}
                      
                      {/* Calendar Days */}
                      {(() => {
                        const daysInMonth = getDaysInMonth(calendarMonth);
                        const firstDay = getFirstDayOfMonth(calendarMonth);
                        const days = [];
                        
                        // Empty cells for days before month starts
                        for (let i = 0; i < firstDay; i++) {
                          days.push(<div key={`empty-${i}`} className="h-8" />);
                        }
                        
                        // Days of the month
                        for (let day = 1; day <= daysInMonth; day++) {
                          // Generate date string consistently to avoid timezone issues
                          const year = calendarMonth.getFullYear();
                          const month = String(calendarMonth.getMonth() + 1).padStart(2, '0');
                          const dayStr = String(day).padStart(2, '0');
                          const dateStr = `${year}-${month}-${dayStr}`;
                          const isDisabled = isDateDisabled(dateStr);
                          const isSelected = tempSelectedDates.includes(dateStr);
                          
                          // Only show existing dates if we haven't started a new selection
                          const showExistingDates = tempSelectedDates.length === 0;
                          const isCheckIn = showExistingDates && isSameDay(dateStr, selectedDate.checkIn);
                          const isCheckOut = showExistingDates && isSameDay(dateStr, selectedDate.checkOut);
                          const isInRange = showExistingDates && isDateInRange(dateStr, selectedDate.checkIn, selectedDate.checkOut);
                          
                          // Show temp range if we have exactly one temp date selected
                          const tempRangeStart = tempSelectedDates.length === 1 ? tempSelectedDates[0] : null;
                          const isInTempRange = tempRangeStart && tempRangeStart !== dateStr && 
                            ((tempRangeStart < dateStr && dateStr < tempRangeStart) || 
                             (dateStr < tempRangeStart && dateStr > tempRangeStart));
                          
                          days.push(
                            <button
                              key={day}
                              onClick={() => handleDateClick(dateStr)}
                              disabled={isDisabled}
                              className={`
                                h-8 w-8 text-sm rounded transition-colors relative
                                ${isDisabled 
                                  ? 'text-gray-600 cursor-not-allowed' 
                                  : 'text-white hover:bg-gray-700 cursor-pointer'
                                }
                                ${isSelected || isCheckIn || isCheckOut 
                                  ? 'bg-orange-500 text-white font-bold' 
                                  : ''
                                }
                                ${(isInRange || isInTempRange) && !isSelected && !isCheckIn && !isCheckOut 
                                  ? 'bg-orange-200 text-orange-900' 
                                  : ''
                                }
                              `}
                            >
                              {day}
                            </button>
                          );
                        }
                        
                        return days;
                      })()}
                    </div>
                    
                    {/* Footer */}
                    <div className="mt-4 pt-3 border-t border-gray-600 flex justify-between items-center">
                      <div className="text-xs text-gray-400">
                        {selectedDate.checkIn && selectedDate.checkOut && tempSelectedDates.length === 0 && (
                          <span className="text-orange-400">
                            {(() => {
                              const checkIn = new Date(selectedDate.checkIn);
                              const checkOut = new Date(selectedDate.checkOut);
                              const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
                              return `${nights} night${nights !== 1 ? 's' : ''} selected`;
                            })()} 
                          </span>
                        )}
                        {tempSelectedDates.length === 1 && (
                          <span className="text-orange-400">Select end date</span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setIsCalendarOpen(false);
                          setTempSelectedDates([]);
                        }}
                        className="px-3 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="relative w-full group">
                <label className="block text-sm font-medium text-gray-400 mb-1">Adults</label>
                <select
                  value={guests.adults}
                  onChange={(e) => setGuests((p) => ({ ...p, adults: +e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 pr-10 text-white focus:ring-orange-500 focus:border-orange-500 appearance-none group-hover:bg-gray-600 transition-colors duration-150"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>

                {/* Custom Arrow Icon */}
                <div
                  className="pointer-events-none absolute right-3 transform -translate-y-1/2 flex items-center"
                  style={{ top: 'calc(70%)' }}
                >
                  <svg
                    className="w-4 h-4 text-gray-400 group-hover:text-gray-200 transition-colors duration-150"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div className="relative w-full group">
                <label className="block text-sm font-medium text-gray-400 mb-1">Children</label>
                <select
                  value={guests.children}
                  onChange={(e) => setGuests(p => ({ ...p, children: +e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 pr-10 text-white focus:ring-orange-500 focus:border-orange-500 appearance-none group-hover:bg-gray-600 transition-colors duration-150"
                >
                  {[0, 1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>

                {/* Custom Arrow Icon */}
                <div
                  className="pointer-events-none absolute right-3 transform -translate-y-1/2 flex items-center"
                  style={{ top: 'calc(70%)' }}
                >
                  <svg
                    className="w-4 h-4 text-gray-400 group-hover:text-gray-200 transition-colors duration-150"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>              
              <div className="relative w-full group">
                <label className="block text-sm font-medium text-gray-400 mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 pr-10 text-white focus:ring-orange-500 focus:border-orange-500 appearance-none group group-hover:bg-gray-600 transition-colors duration-150"
                >
                  {['USD', 'AUD', 'EUR', 'GBP', 'CAD', 'JPY'].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>

                {/* Custom Arrow Icon */}
                <div
                  className="pointer-events-none absolute right-3 transform -translate-y-1/2 flex items-center"
                  style={{ top: 'calc(70%)' }}
                >
                  <svg
                    className="w-4 h-4 text-gray-400 group-hover:text-gray-200 transition-colors duration-150"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
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
