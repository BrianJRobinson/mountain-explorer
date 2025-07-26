// Booking context utility for persisting travel dates and guest counts across sessions

export interface BookingDetails {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
}

const BOOKING_STORAGE_KEY = 'mountain-explorer-booking-details';

// Helper functions for date formatting
export function getTomorrowDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

export function getDayAfterTomorrowDate(): string {
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  return dayAfter.toISOString().split('T')[0];
}

// Get default booking details
export function getDefaultBookingDetails(): BookingDetails {
  return {
    checkIn: getTomorrowDate(),
    checkOut: getDayAfterTomorrowDate(),
    adults: 2,
    children: 0
  };
}

// Save booking details to localStorage
export function saveBookingDetails(details: BookingDetails): void {
  try {
    if (typeof window !== 'undefined') {
      const serialized = JSON.stringify(details);
      localStorage.setItem(BOOKING_STORAGE_KEY, serialized);
      console.log('🔄 [BOOKING DEBUG] Saved booking details to localStorage:', {
        details,
        serialized,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        storageKey: BOOKING_STORAGE_KEY
      });
      
      // Verify the save worked
      const verification = localStorage.getItem(BOOKING_STORAGE_KEY);
      if (verification !== serialized) {
        console.error('🚨 [BOOKING DEBUG] Save verification failed!', {
          expected: serialized,
          actual: verification
        });
      }
    } else {
      console.warn('🚨 [BOOKING DEBUG] Cannot save - window is undefined');
    }
  } catch (error) {
    console.error('🚨 [BOOKING DEBUG] Failed to save booking details:', error);
  }
}

// Load booking details from localStorage
export function loadBookingDetails(): BookingDetails {
  console.log('📥 [BOOKING DEBUG] Loading booking details from localStorage...', {
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : 'SSR',
    storageKey: BOOKING_STORAGE_KEY
  });
  
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(BOOKING_STORAGE_KEY);
      console.log('📥 [BOOKING DEBUG] Raw stored value from localStorage:', {
        stored,
        type: typeof stored,
        length: stored?.length || 0
      });
      
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('✅ [BOOKING DEBUG] Successfully loaded booking details from localStorage:', {
          parsed,
          isValid: !!(parsed.checkIn && parsed.checkOut && parsed.adults),
          timestamp: new Date().toISOString()
        });
        return parsed;
      } else {
        console.log('ℹ️ [BOOKING DEBUG] No stored booking details found in localStorage');
      }
    } else {
      console.log('ℹ️ [BOOKING DEBUG] Window undefined - using defaults (SSR)');
    }
  } catch (error) {
    console.error('🚨 [BOOKING DEBUG] Failed to load booking details from localStorage:', error);
  }
  
  const defaults = getDefaultBookingDetails();
  console.log('🔄 [BOOKING DEBUG] Using default booking details:', {
    defaults,
    reason: 'No stored data or error occurred',
    timestamp: new Date().toISOString()
  });
  return defaults;
}

// Clear booking details from localStorage
export function clearBookingDetails(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(BOOKING_STORAGE_KEY);
      console.log('🗑️ [BOOKING DEBUG] Booking details cleared from localStorage');
    }
  } catch (error) {
    console.error('🚨 [BOOKING DEBUG] Failed to clear booking details from localStorage:', error);
  }
}

// Update specific booking detail and save
export function updateBookingDetail<K extends keyof BookingDetails>(
  key: K,
  value: BookingDetails[K]
): BookingDetails {
  const current = loadBookingDetails();
  const updated = { ...current, [key]: value };
  saveBookingDetails(updated);
  return updated;
}

// Update multiple booking details and save
export function updateBookingDetails(updates: Partial<BookingDetails>): BookingDetails {
  const current = loadBookingDetails();
  const updated = { ...current, ...updates };
  saveBookingDetails(updated);
  return updated;
}
