import React, { useState, useEffect, useRef, useReducer } from 'react';

// Helper function to render star ratings
const renderStars = (starCount: number, numericRating?: number): string => {
  let starsHtml = '';
  if (starCount > 0) {
    const filledStar = `<svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>`;
    // Show only the actual number of stars the hotel has (not out of 5)
    for (let i = 0; i < starCount; i++) {
      starsHtml += filledStar;
    }
  }

  let ratingHtml = '';
  if (numericRating && numericRating > 0) {
    ratingHtml = `<span class="text-sm font-bold text-blue-600 ml-2">${numericRating.toFixed(1)}</span>`;
  }

  if (!starsHtml && !ratingHtml) {
    return ''; // Return nothing if there's nothing to show
  }

  return `<div class="flex items-center">${starsHtml}${ratingHtml}</div>`;
};

import { useHotelsNearby } from '@/lib/hotelService';

// Define the props for the HotelMarkers component
interface HotelMarkersProps {
  map: L.Map | null; // Leaflet map instance
  centerLat: number;
  centerLng: number;
  radius: number;
  visible: boolean;
  useManualRefresh?: boolean;
  onRefreshReady?: (refetch: () => void) => void;
  onLoadingChange?: (loading: boolean) => void;
  onSearchAreaChange?: (centerLat: number, centerLng: number, radius: number) => void;
}

// A simple, local LoadingIndicator component to avoid import issues.
const LoadingIndicator: React.FC<{ loading: boolean }> = ({ loading }) => {
  if (!loading) return null;

  return (
    <div className="absolute z-[1000] bottom-8 right-8 bg-purple-800 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 animate-spin"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      <span>Loading hotels...</span>
    </div>
  );
};

// Inject cluster styles into the document head
const addClusterStyles = () => {
  if (typeof window === 'undefined') return;
  
  const styleId = 'marker-cluster-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.innerHTML = `
    .marker-cluster-small div, .marker-cluster-medium div, .marker-cluster-large div {
      width: 40px; 
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: white;
      border: 2px solid white;
    }
    .marker-cluster-small div { background-color: rgba(107, 33, 168, 0.8); }
    .marker-cluster-medium div { background-color: rgba(126, 34, 206, 0.8); }
    .marker-cluster-large div { background-color: rgba(147, 51, 234, 0.8); }
    .hotel-popup .leaflet-popup-content-wrapper {
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .hotel-popup .leaflet-popup-content {
      margin: 0;
      padding: 0;
    }
    .hotel-popup .leaflet-popup-tip {
      background: #ffffff;
    }
  `;
  document.head.appendChild(style);
};

interface MapState {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clusterLayer: any | null; // Will be L.MarkerClusterGroup when available
}

interface MapAction {
  type: 'SET_MARKERS' | 'CLEAR_ALL';
  payload: { 
    map?: L.Map | null; // Will be L.Map when available
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    clusterLayer?: any | null; // Will be L.MarkerClusterGroup when available
  };
}

// Reducer for managing map state to prevent race conditions
const mapStateReducer = (state: MapState, action: MapAction): MapState => {
  switch (action.type) {
    case 'SET_MARKERS':
      // Clear previous layers before adding new ones
      if (state.clusterLayer && action.payload.map) {
        try {
          action.payload.map.removeLayer(state.clusterLayer);
        } catch (e) {
          console.warn('Could not remove stale cluster layer', e);
        }
      }
      return {
        ...state,
        clusterLayer: action.payload.clusterLayer || null,
      };
    case 'CLEAR_ALL':
      if (state.clusterLayer && action.payload.map) {
        try {
          action.payload.map.removeLayer(state.clusterLayer);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          // Ignore errors if layer is already removed
        }
      }
      return { ...state, clusterLayer: null };
    default:
      return state;
  }
};

export const HotelMarkers: React.FC<HotelMarkersProps> = ({
  map,
  centerLat,
  centerLng,
  radius,
  visible,
  useManualRefresh = false,
  onRefreshReady,
  onLoadingChange,
  onSearchAreaChange,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [mapState, dispatch] = useReducer(mapStateReducer, {
    clusterLayer: null,
  });

  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: centerLat, lng: centerLng });
  const [dynamicRadius, setDynamicRadius] = useState<number>(radius);
  const [showRefreshHint, setShowRefreshHint] = useState(false);
  const moveTimeout = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  const calculateRadiusFromZoom = (zoom: number): number => {
    if (zoom >= 18) return 1000;
    if (zoom >= 16) return 2000;
    if (zoom >= 14) return 5000;
    if (zoom >= 12) return 10000;
    if (zoom >= 10) return 15000;
    if (zoom >= 8) return 25000;
    if (zoom >= 6) return 35000;
    return 50000; // Max 50km for very zoomed out views
  };

  const { nearbyHotels: hotels = [], loading, refetch } = useHotelsNearby(
    mapCenter.lat,
    mapCenter.lng,
    dynamicRadius,
    visible
  );

  // Debug logging for API calls
  useEffect(() => {
    if (visible && !loading) {
      console.log('🏨 [HOTEL API DEBUG] Search parameters:', {
        centerLat: mapCenter.lat,
        centerLng: mapCenter.lng,
        radius: dynamicRadius,
        radiusKm: Math.round(dynamicRadius / 1000),
        zoom: map?.getZoom?.(),
        hotelsFound: hotels?.length || 0,
        visible: visible
      });
      
      // Log hotel locations to check if they're within the expected radius
      if (hotels && hotels.length > 0) {
        const hotelsOutsideRadius = hotels.filter(hotel => {
          const distance = Math.sqrt(
            Math.pow((hotel.latitude - mapCenter.lat) * 111000, 2) + 
            Math.pow((hotel.longitude - mapCenter.lng) * 111000, 2)
          );
          return distance > dynamicRadius;
        });
        
        if (hotelsOutsideRadius.length > 0) {
          console.warn('⚠️ [HOTEL API DEBUG] Hotels found outside search radius:', {
            totalHotels: hotels.length,
            hotelsOutsideRadius: hotelsOutsideRadius.length,
            searchRadius: dynamicRadius,
            searchRadiusKm: Math.round(dynamicRadius / 1000),
            exampleOutsideHotel: hotelsOutsideRadius[0]
          });
        }
      }
    }
  }, [mapCenter.lat, mapCenter.lng, dynamicRadius, hotels, loading, visible, map]);

  useEffect(() => {
    addClusterStyles();
    isMounted.current = true;
    
    // Initial search area circle
    if (onSearchAreaChange) {
      onSearchAreaChange(centerLat, centerLng, radius);
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [onSearchAreaChange, centerLat, centerLng, radius]);

  // Final cleanup on unmount
  useEffect(() => {
    return () => {
      // Use a timeout to ensure cleanup runs after any final renders
      setTimeout(() => {
        if (!isMounted.current) { 
          dispatch({ type: 'CLEAR_ALL', payload: { map } });
        }
      }, 0);
    }
  }, [map]);

  useEffect(() => {
    if (!map) return;

    const handleMoveEnd = () => {
      if (moveTimeout.current) clearTimeout(moveTimeout.current);
      moveTimeout.current = setTimeout(() => {
        const currentMap = map ;
        if (!currentMap) return;
        
        // Add robust validation for map access
        if (map && (!map.getContainer || !map.getContainer())) return;

        const center = currentMap.getCenter();
        const zoom = currentMap.getZoom();
        const newRadius = calculateRadiusFromZoom(zoom);

        setMapCenter({ lat: center.lat, lng: center.lng });
        setDynamicRadius(newRadius);
        
        // Update search area circle if callback provided
        if (onSearchAreaChange) {
          onSearchAreaChange(center.lat, center.lng, newRadius);
        }
        
        // Show refresh hint if manual refresh is enabled
        if (useManualRefresh) {
          console.log('🔄 [HOTEL MARKERS] Map moved, showing refresh hint');
          setShowRefreshHint(true);
        }
      }, 1000);
    };

    if (map && map.getContainer && map.getContainer()) {
      map.on('moveend', handleMoveEnd);
    }

    return () => {
      if (map && map.getContainer && map.getContainer()) {
        map.off('moveend', handleMoveEnd);
      }
      if (moveTimeout.current) clearTimeout(moveTimeout.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, useManualRefresh]);

  useEffect(() => {
    if (!visible) {
      if (map && map.getContainer && map.getContainer()) {
        dispatch({ type: 'CLEAR_ALL', payload: { map } });
      }
      return;
    }

    if (loading || !hotels) {
      return;
    }

    const addMarkersAsync = async () => {
      if (!isMounted.current) return;

      // Add a small delay to ensure map is fully initialized
      await new Promise(resolve => setTimeout(resolve, 100));
      if (!isMounted.current) return;

      // Dynamic import of Leaflet to avoid SSR issues
      const L = await import('leaflet').then(m => m.default);
      await import('leaflet.markercluster');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let newClusterLayer: any = null;

      if (!map || !map.getContainer || !map.getContainer()) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const clusterLayer = new (L as any).markerClusterGroup({
        maxClusterRadius: 40,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        disableClusteringAtZoom: 14,
        animate: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        iconCreateFunction: (c: any) => {
          const count = c.getChildCount();
          const size = count > 20 ? 'large' : count > 10 ? 'medium' : 'small';
          return L.divIcon({
            html: `<div class="cluster-marker cluster-marker-${size} bg-purple-800 text-white rounded-full border-2 border-white flex items-center justify-center font-bold">${count}</div>`,
            className: `marker-cluster marker-cluster-${size}`,
            iconSize: L.point(40, 40),
          });
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hotels.forEach((hotel: any) => {
        if (!isMounted.current) return;
        const marker = L.marker([hotel.latitude, hotel.longitude], {
          icon: L.divIcon({
            className: 'hotel-marker-icon',
            html: `<div class="w-6 h-6 bg-purple-800 rounded-full border-2 border-white shadow-lg flex items-center justify-center hover:bg-purple-600 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" class="w-4 h-4"><path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" /><path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" /></svg></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          }),
        }).bindPopup(() => {
          return (
            `<div class="w-64 font-sans">
              ${hotel.thumbnail ? `<img src="${hotel.thumbnail}" alt="${hotel.name}" class="w-full h-32 object-cover rounded-t-lg" />` : ''}
              <div class="p-3">
                <h3 class="text-lg font-bold text-gray-900 truncate">${hotel.name}</h3>
                <div class="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                  ${renderStars(hotel.starRating || 0, hotel.rating || 0)}
                </div>
                <a href="/hotels/${hotel.id}?lat=${hotel.latitude}&lng=${hotel.longitude}&stars=${hotel.starRating || 0}" target="_blank" rel="noopener noreferrer" class="mt-4 block w-full text-center bg-orange-500 hover:bg-orange-600 !text-white font-semibold py-2 px-4 rounded-md transition-colors no-underline">
                  View Details
                </a>
              </div>
            </div>`
          );
        }, { className: 'hotel-popup' });
        clusterLayer.addLayer(marker);
      });

      // More robust map readiness check
      const mapContainer = map?.getContainer?.();
      if (isMounted.current && map && mapContainer && mapContainer.offsetParent !== null) {
        try {
          // Additional validation before adding layer
          if (clusterLayer) {
            map.addLayer(clusterLayer);
            newClusterLayer = clusterLayer;
          }
        } catch (error) {
          console.warn('Could not add cluster layer to map:', error);
          // Don't set the cluster layer if it failed to add
          newClusterLayer = null;
        }
      } else {
        // If map is not ready, don't set the cluster layer
        newClusterLayer = null;
      }

      if (isMounted.current && map && map.getContainer && map.getContainer()) {
        dispatch({
          type: 'SET_MARKERS',
          payload: { map, clusterLayer: newClusterLayer},
        });
      }
    };

    addMarkersAsync();

  }, [hotels, visible, loading, map]);

  useEffect(() => {
    if (onLoadingChange) onLoadingChange(loading);
  }, [loading, onLoadingChange]);

  // This function will be passed up to the parent to be called on manual refresh
  const handleManualRefresh = () => {
    const currentMap = map;
    if (!currentMap) return;

    const center = currentMap.getCenter();
    const zoom = currentMap.getZoom();
    const newRadius = calculateRadiusFromZoom(zoom);

    // Update the state with the new center and radius
    setMapCenter({ lat: center.lat, lng: center.lng });
    setDynamicRadius(newRadius);

    // Hide the refresh hint when refresh is triggered
    setShowRefreshHint(false);

    // The state update will trigger the useEffect that calls the hook.
    // We can also call refetch() if we want to force it even if coordinates are the same.
    refetch();
  };

  useEffect(() => {
    if (useManualRefresh && onRefreshReady) {
      onRefreshReady(handleManualRefresh);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useManualRefresh, onRefreshReady, map]);

  return (
    <>
      <LoadingIndicator loading={loading && !useManualRefresh} />
      {showRefreshHint && useManualRefresh && (
        <div className="fixed z-[9999] top-20 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse border-2 border-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-sm font-medium">Click refresh to see hotels in this area</span>
        </div>
      )}
    </>
  );
};
