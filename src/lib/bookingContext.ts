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
      // Saved booking details to localStorage
    } else {
      console.warn('🚨 [BOOKING DEBUG] Cannot save - window is undefined');
    }
  } catch (error) {
    console.error('🚨 [BOOKING DEBUG] Failed to save booking details:', error);
  }
}

// Load booking details from localStorage
export function loadBookingDetails(): BookingDetails {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(BOOKING_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed;
      } else {
        // No stored booking details found
      }
    } else {
      // Window undefined - using defaults (SSR)
    }
  } catch (error) {
    console.error('🚨 [BOOKING DEBUG] Failed to load booking details from localStorage:', error);
  }
  const defaults = getDefaultBookingDetails();
  return defaults;
}

// Clear booking details from localStorage
export function clearBookingDetails(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(BOOKING_STORAGE_KEY);
      // Booking details cleared from localStorage
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
