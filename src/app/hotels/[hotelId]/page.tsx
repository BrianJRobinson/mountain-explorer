'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useHotelDetails, HotelDetails, useHotelsNearby, Hotel } from '@/lib/hotelService';
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

// --- Nearby Hotels Sidebar Component ---
const NearbyHotels: React.FC<{ hotels: Hotel[] | undefined, loading: boolean, error: any }> = ({ hotels, loading, error }) => {
  if (loading) return <div className="mt-8"><p>Loading nearby hotels...</p></div>;
  if (error) return <div className="mt-8"><p className="text-red-500">Error loading nearby hotels.</p></div>;
  if (!hotels || hotels.length === 0) return <div className="mt-8"><p>No nearby hotels found.</p></div>;

  // Limit to 3 rows of 5 columns (15 hotels)
  const displayedHotels = hotels.slice(0, 15);

  return (
    <div className="mt-12">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Nearby Hotels</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {displayedHotels.map(nearbyHotel => (
          <Link 
            href={`/hotels/${nearbyHotel.id}?lat=${nearbyHotel.latitude}&lng=${nearbyHotel.longitude}`} 
            key={nearbyHotel.id} 
            className="block border rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out"
          >
            <img 
              src={nearbyHotel.thumbnail || 'https://via.placeholder.com/300x200?text=No+Image'} 
              alt={`Thumbnail for ${nearbyHotel.name}`} 
              className="w-full h-32 object-cover"
            />
            <div className="p-3 flex flex-col flex-grow">
              <h3 className="font-semibold text-md text-gray-800 truncate" title={nearbyHotel.name}>{nearbyHotel.name}</h3>
              <p className="text-sm text-gray-500 flex-grow">{nearbyHotel.city}</p>
              <div className="mt-2 flex justify-between items-center text-sm pt-2 border-t border-gray-100">
                {(nearbyHotel.starRating ?? 0) > 0 && (
                  <div className="text-yellow-500">
                    {'★'.repeat(Math.floor(nearbyHotel.starRating ?? 0))}
                  </div>
                )}
                {(nearbyHotel.rating ?? 0) > 0 && (
                  <div className="text-blue-600 font-bold ml-auto pl-2">
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

  // Get lat/lng from URL params as a fallback
  const urlLat = searchParams.get('lat');
  const urlLng = searchParams.get('lng');

  const { hotel, loading, error } = useHotelDetails(hotelId);

  // Prioritize URL coordinates, then fall back to fetched hotel coordinates
  const latitude = urlLat ? parseFloat(urlLat) : hotel?.latitude;
  const longitude = urlLng ? parseFloat(urlLng) : hotel?.longitude;
  const hasValidCoordinates = !!latitude && !!longitude;

  const { nearbyHotels, loading: nearbyLoading, error: nearbyError } = useHotelsNearby(
    latitude ?? 0,
    longitude ?? 0,
    10000, // 10km radius
    // Enable if we have coordinates from either URL or fetched data
    hasValidCoordinates,
    hotelId
  );

  if (loading) return <LoadingState />;
  if (error || !hotel) return <ErrorState error={error} />;

  return (
    <div className="min-h-screen bg-[#0b1120] text-gray-300">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-orange-400 hover:text-orange-300 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Map
          </Link>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* --- Main Hotel Details --- */}
          <HotelDetailsContent hotel={hotel} />

          {/* --- Nearby Hotels Section --- */}
          <div className="mt-12">
            {hasValidCoordinates ? (
              <NearbyHotels hotels={nearbyHotels} loading={nearbyLoading} error={nearbyError} />
            ) : (
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Nearby Hotels</h2>
                <p className="text-gray-600">Location data is not available for this hotel, so we cannot show nearby hotels.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Child Components ---

function HotelDetailsContent({ hotel }: { hotel: HotelDetails }) {
  const [selectedDate, setSelectedDate] = useState({ checkIn: getTomorrowDate(), checkOut: getDayAfterTomorrowDate() });
  const [guests, setGuests] = useState({ adults: 2, children: 0 });
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  const handleBookNow = () => {
    alert(`Booking for ${hotel.name} from ${selectedDate.checkIn} to ${selectedDate.checkOut}`);
  };

  return (
    <div className="space-y-8">
      {/* Header Image & Title */}
      <div className="relative rounded-lg overflow-hidden bg-gray-800 h-96">
        {hotel.images && hotel.images.length > 0 ? (
          <img src={hotel.images[0]} alt={hotel.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">No image available</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6">
          <h1 className="text-white text-4xl font-bold">{hotel.name}</h1>
          <div className="flex items-center mt-2">
            {hotel.starRating && <div className="text-yellow-400 text-xl">{'★'.repeat(hotel.starRating)}</div>}
            {hotel.rating && <div className="ml-4 bg-blue-500 text-white px-2 py-1 rounded text-sm font-bold">{hotel.rating.toFixed(1)}/10</div>}
          </div>
        </div>
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {hotel.amenities.map((amenity, i) => <div key={i} className="flex items-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>{amenity}</div>)}
              </div>
            ) : <p className="text-gray-500">No amenities information available.</p>}
          </div>

          {/* Rooms Section */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-white mb-4">Available Rooms</h2>
            <div className="space-y-4">
              {hotel.roomTypes?.map(room => (
                <div key={room.id} className={`p-4 rounded-lg border-2 ${selectedRoom === room.id ? 'border-orange-500 bg-gray-700' : 'border-gray-700 hover:border-orange-500/50'}`} onClick={() => setSelectedRoom(room.id)}>
                  <div className="flex flex-col sm:flex-row gap-4">
                    {room.images?.[0] && <img src={room.images[0]} alt={room.name} className="w-full sm:w-48 h-32 object-cover rounded" />}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white">{room.name}</h3>
                      <p className="text-gray-400 mt-1">{room.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-lg font-bold text-orange-400">{room.price ? `${room.currency || '£'}${room.price}` : 'Price not available'}</div>
                        <div className="text-sm text-gray-400">Max Guests: {room.maxOccupancy}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
              <button onClick={handleBookNow} disabled={!selectedRoom} className="w-full py-3 mt-4 rounded-md font-bold text-white transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed bg-orange-600 hover:bg-orange-500">
                {selectedRoom ? 'Book Now' : 'Select a Room'}
              </button>
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
