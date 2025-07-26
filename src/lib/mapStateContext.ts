// Conservative map state persistence utility
// Focuses on essential state without coordinate precision to avoid infinite loops

export interface MapState {
  activeMountainId?: number;
  hotelsVisible: boolean;
  // Map position and zoom for persistence
  center?: { lat: number; lng: number };
  zoom?: number;
}

const MAP_STATE_STORAGE_KEY = 'mountain-explorer-map-state';

// Get default map state
export function getDefaultMapState(): MapState {
  return {
    activeMountainId: undefined,
    hotelsVisible: false,
    center: undefined,
    zoom: undefined
  };
}

// Save map state to sessionStorage (per-tab, not cross-session)
export function saveMapState(state: MapState): void {
  try {
    if (typeof window !== 'undefined') {
      const serialized = JSON.stringify(state);
      sessionStorage.setItem(MAP_STATE_STORAGE_KEY, serialized);
      // Map state saved to sessionStorage
    }
  } catch (error) {
    console.error('🚨 [MAP STATE] Failed to save map state:', error);
  }
}

// Load map state from sessionStorage
export function loadMapState(): MapState {
  // Loading map state from sessionStorage
  
  try {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(MAP_STATE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Successfully loaded map state from sessionStorage
        return parsed;
      } else {
        // No stored map state found
      }
    } else {
      // Window undefined - using defaults (SSR)
    }
  } catch (error) {
    console.error('🚨 [MAP STATE] Failed to load map state:', error);
  }
  
  const defaults = getDefaultMapState();
  // Using default map state
  return defaults;
}

// Clear map state from sessionStorage
export function clearMapState(): void {
  try {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(MAP_STATE_STORAGE_KEY);
      // Map state cleared from sessionStorage
    }
  } catch (error) {
    console.error('🚨 [MAP STATE] Failed to clear map state:', error);
  }
}

// Update specific fields in map state
export function updateMapState(updates: Partial<MapState>): void {
  const currentState = loadMapState();
  const newState = { ...currentState, ...updates };
  saveMapState(newState);
}

// Update map position and zoom
export function updateMapPosition(center: { lat: number; lng: number }, zoom: number): void {
  const currentState = loadMapState();
  const newState = { ...currentState, center, zoom };
  saveMapState(newState);
  // Updated map position in sessionStorage
}
