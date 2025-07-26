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
      console.log('🗺️ [MAP STATE] Saved map state:', {
        state,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('🚨 [MAP STATE] Failed to save map state:', error);
  }
}

// Load map state from sessionStorage
export function loadMapState(): MapState {
  console.log('🗺️ [MAP STATE] Loading map state...');
  
  try {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(MAP_STATE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('✅ [MAP STATE] Successfully loaded map state:', parsed);
        return parsed;
      } else {
        console.log('ℹ️ [MAP STATE] No stored map state found');
      }
    } else {
      console.log('ℹ️ [MAP STATE] Window undefined - using defaults (SSR)');
    }
  } catch (error) {
    console.error('🚨 [MAP STATE] Failed to load map state:', error);
  }
  
  const defaults = getDefaultMapState();
  console.log('🔄 [MAP STATE] Using default map state:', defaults);
  return defaults;
}

// Clear map state from sessionStorage
export function clearMapState(): void {
  try {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(MAP_STATE_STORAGE_KEY);
      console.log('🗑️ [MAP STATE] Map state cleared');
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
  console.log('🗺️ [MAP STATE] Updated map position:', { center, zoom });
}
