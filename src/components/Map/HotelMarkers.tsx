import React, { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap, DivIcon, Point } from 'leaflet';
import type { Map as MapLibreMap, Marker } from 'maplibre-gl';
import { Hotel, useHotelsNearby } from '@/lib/hotelService';

// Define the cluster type for the iconCreateFunction
interface MarkerCluster {
  getChildCount(): number;
}

interface HotelMarkersProps {
  map: LeafletMap | null;
  maplibreMap: MapLibreMap | null;
  is3DMode: boolean;
  centerLat: number;
  centerLng: number;
  radius: number; // Base radius, will be adjusted based on zoom level
  visible: boolean;
  useManualRefresh?: boolean; // If true, disable auto-refresh
  onRefreshReady?: (refreshFn: () => void) => void; // Function to pass the refresh function to parent
  onLoadingChange?: (isLoading: boolean) => void; // Function to notify parent of loading state changes
}

// Loading indicator component
const LoadingIndicator: React.FC<{
  loading: boolean;
}> = ({ loading }) => {
  if (!loading) return null;
  
  return (
    <div className="absolute z-50 bottom-8 right-8 bg-purple-800 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
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

// Add CSS for cluster markers to the document
const addClusterStyles = () => {
  // Check if styles already exist
  if (document.getElementById('hotel-marker-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'hotel-marker-styles';
  style.innerHTML = `
    .cluster-marker {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      border-radius: 50%;
      box-shadow: 0 0 0 2px white;
    }
    .cluster-marker-small {
      font-size: 12px;
    }
    .cluster-marker-medium {
      font-size: 14px;
    }
    .cluster-marker-large {
      font-size: 16px;
    }
    .marker-cluster {
      background: transparent;
      border: none;
    }
  `;
  document.head.appendChild(style);
};

export const HotelMarkers: React.FC<HotelMarkersProps> = ({
  map,
  maplibreMap,
  is3DMode,
  centerLat,
  centerLng,
  radius,
  visible,
  useManualRefresh = false,
  onRefreshReady,
  onLoadingChange
}) => {
  // Track map center and zoom for refreshing hotels
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: centerLat, lng: centerLng });
  const [mapZoomLevel, setMapZoomLevel] = useState<number>(14); // Default zoom level
  const [dynamicRadius, setDynamicRadius] = useState<number>(radius);
  const moveTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Calculate dynamic radius based on zoom level
  const calculateRadiusFromZoom = (zoom: number): number => {
    // Zoom levels typically range from 0 (whole world) to 20 (building level)
    // Adjust radius inversely to zoom level
    // At high zoom (e.g., 18-20), use smaller radius (1-2km)
    // At low zoom (e.g., 10-12), use larger radius (10-20km)
    if (zoom >= 18) return 1000; // 1km at very high zoom
    if (zoom >= 16) return 2000; // 2km at high zoom
    if (zoom >= 14) return 5000; // 5km at medium-high zoom
    if (zoom >= 12) return 10000; // 10km at medium zoom
    if (zoom >= 10) return 15000; // 15km at medium-low zoom
    return 20000; // 20km at low zoom
  };
  
  // Use the current map center and dynamic radius for fetching hotels
  const { hotels, loading, refetch } = useHotelsNearby(
    mapCenter.lat, 
    mapCenter.lng, 
    dynamicRadius, 
    visible
  );
  const markers2D = useRef<any[]>([]);
  const markers3D = useRef<Marker[]>([]);
  const [isClusteringEnabled, setIsClusteringEnabled] = useState(true);
  // Keep track of the cluster layer
  const clusterLayer = useRef<any>(null);
  
  // Add cluster styles when component mounts
  useEffect(() => {
    addClusterStyles();
  }, []);
  
  // Handle map movement and zoom changes to update hotel markers
  useEffect(() => {
    if (!map && !maplibreMap) return;
    
    // Initialize map center and zoom level
    let initialZoom = 14; // Default zoom level
    
    if (map) {
      setMapCenter({ lat: centerLat, lng: centerLng });
      initialZoom = map.getZoom();
      setMapZoomLevel(initialZoom);
      setDynamicRadius(calculateRadiusFromZoom(initialZoom));
    } else if (maplibreMap) {
      setMapCenter({ lat: centerLat, lng: centerLng });
      initialZoom = maplibreMap.getZoom();
      setMapZoomLevel(initialZoom);
      setDynamicRadius(calculateRadiusFromZoom(initialZoom));
    }
    
    // Only set up auto-refresh if not using manual refresh
    if (!useManualRefresh) {
      const handleMapMoveEnd = () => {
        // Clear previous timeout
        if (moveTimeout.current) {
          clearTimeout(moveTimeout.current);
        }
        
        // Set a new timeout to avoid too many refreshes
        moveTimeout.current = setTimeout(() => {
          // Get new center and zoom
          let newLat = centerLat;
          let newLng = centerLng;
          let newZoom = mapZoomLevel;
          
          if (map) {
            const center = map.getCenter();
            newLat = center.lat;
            newLng = center.lng;
            newZoom = map.getZoom();
          } else if (maplibreMap) {
            const center = maplibreMap.getCenter();
            newLat = center.lat;
            newLng = center.lng;
            newZoom = maplibreMap.getZoom();
          }
          
          // Calculate distance moved
          const distance = getDistanceFromLatLonInKm(
            mapCenter.lat, 
            mapCenter.lng, 
            newLat, 
            newLng
          );
          
          // Calculate new radius based on zoom
          const newRadius = calculateRadiusFromZoom(newZoom);
          
          // Update state and trigger refresh if significant change
          const zoomChanged = newZoom !== mapZoomLevel;
          const significantMove = distance > 0.5; // 500m threshold
          
          if (significantMove || zoomChanged) {
            console.log(`[HotelMarkers] Map updated: moved=${distance.toFixed(1)}km, zoom=${newZoom}, radius=${newRadius}m`);
            
            // Update state
            setMapCenter({ lat: newLat, lng: newLng });
            setMapZoomLevel(newZoom);
            setDynamicRadius(newRadius);
            
            // Auto-refresh hotels
            refetch();
          }
        }, 1000); // Wait 1 second after movement stops
      };
      
      // Also handle zoom changes separately
      const handleZoomEnd = () => {
        let newZoom = mapZoomLevel;
        
        if (map) {
          newZoom = map.getZoom();
        } else if (maplibreMap) {
          newZoom = maplibreMap.getZoom();
        }
        
        // Update radius based on new zoom level
        const newRadius = calculateRadiusFromZoom(newZoom);
        
        if (newZoom !== mapZoomLevel) {
          console.log(`[HotelMarkers] Zoom changed: ${newZoom}, new radius: ${newRadius}m`);
          setMapZoomLevel(newZoom);
          setDynamicRadius(newRadius);
        }
      };
      
      // Add event listeners for auto-refresh
      if (map) {
        map.on('moveend', handleMapMoveEnd);
        map.on('zoomend', handleZoomEnd);
      } else if (maplibreMap) {
        maplibreMap.on('moveend', handleMapMoveEnd);
        maplibreMap.on('zoomend', handleZoomEnd);
      }
      
      // Cleanup
      return () => {
        if (moveTimeout.current) {
          clearTimeout(moveTimeout.current);
        }
        
        if (map) {
          map.off('moveend', handleMapMoveEnd);
          map.off('zoomend', handleZoomEnd);
        } else if (maplibreMap) {
          maplibreMap.off('moveend', handleMapMoveEnd);
          maplibreMap.off('zoomend', handleZoomEnd);
        }
      };
    } else {
      // For manual refresh mode, just track zoom changes to update radius
      const handleZoomChange = () => {
        let newZoom;
        if (map) {
          newZoom = map.getZoom();
        } else if (maplibreMap) {
          newZoom = maplibreMap.getZoom();
        } else {
          return;
        }
        
        setMapZoomLevel(newZoom);
        setDynamicRadius(calculateRadiusFromZoom(newZoom));
      };
      
      // Add zoom event listeners
      if (map) {
        map.on('zoomend', handleZoomChange);
      } else if (maplibreMap) {
        maplibreMap.on('zoomend', handleZoomChange);
      }
      
      return () => {
        if (map) {
          map.off('zoomend', handleZoomChange);
        } else if (maplibreMap) {
          maplibreMap.off('zoomend', handleZoomChange);
        }
      };
    }
  }, [map, maplibreMap, centerLat, centerLng, useManualRefresh]);
  

  
  // Helper function to calculate distance between coordinates
  const getDistanceFromLatLonInKm = (
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in km
    return d;
  };
  
  const deg2rad = (deg: number): number => {
    return deg * (Math.PI/180);
  };

  // Clean up markers when component unmounts
  useEffect(() => {
    return () => {
      // Clean up 2D markers
      markers2D.current.forEach(marker => {
        if (map) marker.remove();
      });
      markers2D.current = [];

      // Clean up 3D markers
      markers3D.current.forEach(marker => {
        if (marker) marker.remove();
      });
      markers3D.current = [];

      // Clean up cluster layer
      if (clusterLayer.current && map) {
        map.removeLayer(clusterLayer.current);
        clusterLayer.current = null;
      }
    };
  }, [map]);

  // Handle visibility changes
  useEffect(() => {
    if (!visible) {
      // Remove all markers when not visible
      markers2D.current.forEach(marker => {
        if (map) marker.remove();
      });
      markers2D.current = [];

      markers3D.current.forEach(marker => {
        if (marker) marker.remove();
      });
      markers3D.current = [];

      if (clusterLayer.current && map) {
        map.removeLayer(clusterLayer.current);
        clusterLayer.current = null;
      }
    }
  }, [visible, map]);

  // Add hotel markers to the map
  useEffect(() => {
    // Cleanup function to remove event listeners
    let cleanupFn: () => void = () => {};

    if (!visible || loading || (!map && !maplibreMap)) {
      console.log('[HotelMarkers] Not adding markers:', { visible, loading, hasMap: !!map, hasMaplibreMap: !!maplibreMap });
      return;
    }
    
    console.log('[HotelMarkers] Adding markers:', { 
      hotelCount: hotels.length, 
      is3DMode, 
      centerLat, 
      centerLng, 
      radius 
    });

    const addMarkers = async (): Promise<(() => void) | undefined> => {
      // Clean up existing markers first
      // Remove 2D markers
      markers2D.current.forEach(marker => {
        if (map) marker.remove();
      });
      markers2D.current = [];
      
      // Remove 3D markers
      markers3D.current.forEach(marker => {
        if (marker) marker.remove();
      });
      markers3D.current = [];
      
      if (hotels.length === 0) {
        console.log('[HotelMarkers] No hotels to display');
        return;
      }
      
      console.log(`[HotelMarkers] Adding ${hotels.length} hotels to the map`);

      if (clusterLayer.current && map) {
        map.removeLayer(clusterLayer.current);
        clusterLayer.current = null;
      }

      if (hotels.length === 0) {
        return;
      }

      // Import libraries based on mode
      if (is3DMode) {
        // 3D mode (MapLibre)
        if (!maplibreMap) return;

        const maplibregl = await import('maplibre-gl').then(m => m.default);
        
        // Add markers in batches for better performance
        const BATCH_SIZE = 10;
        const BATCH_DELAY = 30; // ms

        for (let i = 0; i < hotels.length; i += BATCH_SIZE) {
          const batch = hotels.slice(i, i + BATCH_SIZE);
          
          await new Promise<void>((resolve) => {
            setTimeout(() => {
              batch.forEach((hotel) => {
                // Create hotel marker element
                const el = document.createElement('div');
                el.className = 'hotel-marker';
                el.innerHTML = `
                  <div class="w-6 h-6 bg-purple-800 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:bg-purple-600 transition-colors">
                    <div class="w-3 h-3 text-white flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" class="w-4 h-4 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
                        <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
                      </svg>
                    </div>
                  </div>
                `;

                // Create popup content
                const popupContent = document.createElement('div');
                popupContent.className = 'text-center bg-white p-2 rounded-lg max-w-xs';
                popupContent.innerHTML = `
                  <div class="flex flex-col gap-1">
                    ${hotel.thumbnail ? `<img src="${hotel.thumbnail}" alt="${hotel.name}" class="w-full h-32 object-cover rounded mb-1" />` : ''}
                    <strong class="text-gray-900 text-lg">${hotel.name}</strong>
                    <div class="text-gray-700 text-sm">${hotel.address || ''}</div>
                    <div class="text-gray-700 text-sm">${hotel.city || ''}${hotel.country ? `, ${hotel.country}` : ''}</div>
                    ${(hotel.starRating || 0) > 0 ? `<div class="text-yellow-500">${'★'.repeat(Math.floor(hotel.starRating || 0))}</div>` : ''}
                    ${(hotel.rating || 0) > 0 ? `<div class="text-blue-500 font-semibold">Rating: ${(hotel.rating || 0).toFixed(1)}/10</div>` : ''}
                  </div>
                `;

                // Create popup
                const popup = new maplibregl.Popup({ offset: 25 })
                  .setDOMContent(popupContent);

                // Create and add marker
                const marker = new maplibregl.Marker(el)
                  .setLngLat([hotel.longitude, hotel.latitude])
                  .setPopup(popup)
                  .addTo(maplibreMap);

                markers3D.current.push(marker);
              });
              resolve();
            }, BATCH_DELAY);
          });
        }
      } else {
        // 2D mode (Leaflet)
        if (!map) return;

        const L = await import('leaflet').then(m => m.default);
        
        // If clustering is enabled, use MarkerClusterGroup
        // Always use clustering for better performance and visibility
        if (isClusteringEnabled) {
          // Import the MarkerClusterGroup plugin
          await import('leaflet.markercluster');
          // Access it through the L object since it extends Leaflet
          
          // Create a new cluster group
          const cluster = new L.MarkerClusterGroup({
            maxClusterRadius: 40, // Reduced from 50 to create smaller clusters
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            disableClusteringAtZoom: 14, // Lower zoom level to disable clustering (was 16)
            animate: true,
            animateAddingMarkers: true,
            // Make clusters more visible
            iconCreateFunction: (cluster: MarkerCluster) => {
              const count = cluster.getChildCount();
              let size = 'small';
              
              if (count > 20) {
                size = 'large';
              } else if (count > 10) {
                size = 'medium';
              }
              
              return L.divIcon({
                html: `<div class="cluster-marker cluster-marker-${size} bg-purple-800 text-white rounded-full border-2 border-white flex items-center justify-center font-bold">${count}</div>`,
                className: `marker-cluster marker-cluster-${size}`,
                iconSize: L.point(40, 40)
              });
            }
          });
          
          // Add markers to the cluster group
          hotels.forEach((hotel) => {
            const marker = L.marker([hotel.latitude, hotel.longitude], {
              icon: L.divIcon({
                className: 'hotel-marker-icon',
                html: `
                  <div class="w-6 h-6 bg-purple-800 rounded-full border-2 border-white shadow-lg flex items-center justify-center hover:bg-purple-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" class="w-4 h-4">
                      <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
                      <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
                    </svg>
                  </div>
                `,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              })
            }).bindPopup(
              `<div class="text-center max-w-xs">
                <div class="flex flex-col gap-1">
                  ${hotel.thumbnail ? `<img src="${hotel.thumbnail}" alt="${hotel.name}" class="w-full h-32 object-cover rounded mb-1" />` : ''}
                  <strong class="text-gray-900 text-lg">${hotel.name}</strong>
                  <div class="text-gray-700 text-sm">${hotel.address || ''}</div>
                  <div class="text-gray-700 text-sm">${hotel.city || ''}${hotel.country ? `, ${hotel.country}` : ''}</div>
                  ${(hotel.starRating || 0) > 0 ? `<div class="text-yellow-500">${'★'.repeat(Math.floor(hotel.starRating || 0))}</div>` : ''}
                  ${(hotel.rating || 0) > 0 ? `<div class="text-blue-500 font-semibold">Rating: ${(hotel.rating || 0).toFixed(1)}/10</div>` : ''}
                </div>
              </div>`,
              { className: 'hotel-popup' }
            );
            
            cluster.addLayer(marker);
          });
          
          // Add the cluster group to the map
          map.addLayer(cluster);
          clusterLayer.current = cluster;
          
          // Add zoom event listener to handle marker visibility
          const zoomHandler = () => {
            const zoom = map.getZoom();
            console.log(`[HotelMarkers] Map zoom changed to ${zoom}`);
            
            // Force cluster redraw on zoom change
            if (clusterLayer.current) {
              // Use setTimeout to ensure clusters refresh after zoom animation completes
              setTimeout(() => {
                if (clusterLayer.current) {
                  clusterLayer.current.refreshClusters();
                }
              }, 300);
            }
          };
          
          map.on('zoomend', zoomHandler);
          
          // Store the handler for cleanup
          cleanupFn = () => {
            map.off('zoomend', zoomHandler);
          };
        } else {
          // Add individual markers without clustering
          hotels.forEach((hotel) => {
            const marker = L.marker([hotel.latitude, hotel.longitude], {
              icon: L.divIcon({
                className: 'hotel-marker-icon',
                html: `
                  <div class="w-6 h-6 bg-purple-800 rounded-full border-2 border-white shadow-lg flex items-center justify-center hover:bg-purple-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" class="w-4 h-4">
                      <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
                      <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
                    </svg>
                  </div>
                `,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              })
            }).bindPopup(
              `<div class="text-center max-w-xs">
                <div class="flex flex-col gap-1">
                  ${hotel.thumbnail ? `<img src="${hotel.thumbnail}" alt="${hotel.name}" class="w-full h-32 object-cover rounded mb-1" />` : ''}
                  <strong class="text-gray-900 text-lg">${hotel.name}</strong>
                  <div class="text-gray-700 text-sm">${hotel.address || ''}</div>
                  <div class="text-gray-700 text-sm">${hotel.city || ''}${hotel.country ? `, ${hotel.country}` : ''}</div>
                  ${(hotel.starRating || 0) > 0 ? `<div class="text-yellow-500">${'★'.repeat(Math.floor(hotel.starRating || 0))}</div>` : ''}
                  ${(hotel.rating || 0) > 0 ? `<div class="text-blue-500 font-semibold">Rating: ${(hotel.rating || 0).toFixed(1)}/10</div>` : ''}
                </div>
              </div>`,
              { className: 'hotel-popup' }
            );
            
            marker.addTo(map);
            markers2D.current.push(marker);
          });
        }
      }
    };

    addMarkers().then(cleanup => {
      if (cleanup) cleanupFn = cleanup;
    });
    
    // Return combined cleanup function
    return () => {
      cleanupFn();
      
      // Clean up existing markers
      markers2D.current.forEach(marker => {
        if (map) marker.remove();
      });
      markers2D.current = [];
      
      markers3D.current.forEach(marker => {
        if (marker) marker.remove();
      });
      markers3D.current = [];
      
      if (clusterLayer.current && map) {
        map.removeLayer(clusterLayer.current);
        clusterLayer.current = null;
      }
    };
  }, [map, maplibreMap, hotels, visible, loading, is3DMode, isClusteringEnabled]);

  // Debug logging
  useEffect(() => {
    console.log('[HotelMarkers] State:', { 
      loading,
      mapCenter,
      zoom: mapZoomLevel,
      radius: dynamicRadius,
      manualRefresh: useManualRefresh
    });
  }, [loading, mapCenter, mapZoomLevel, dynamicRadius, useManualRefresh]);

  // Provide the manual refresh function to parent component
  useEffect(() => {
    if (useManualRefresh && onRefreshReady) {
      // Create a refresh function that updates the map center and refreshes hotels
      const refreshFunction = () => {
        // Get current map center and zoom
        let currentLat = centerLat;
        let currentLng = centerLng;
        let currentZoom = mapZoomLevel;
        
        if (map) {
          const center = map.getCenter();
          currentLat = center.lat;
          currentLng = center.lng;
          currentZoom = map.getZoom();
        } else if (maplibreMap) {
          const center = maplibreMap.getCenter();
          currentLat = center.lat;
          currentLng = center.lng;
          currentZoom = maplibreMap.getZoom();
        }
        
        // Update state with current map position
        setMapCenter({ lat: currentLat, lng: currentLng });
        setMapZoomLevel(currentZoom);
        setDynamicRadius(calculateRadiusFromZoom(currentZoom));
        
        console.log(`[HotelMarkers] Manual refresh at: lat=${currentLat}, lng=${currentLng}, zoom=${currentZoom}, radius=${dynamicRadius}m`);
        
        // Trigger hotel data refresh
        refetch();
      };
      
      // Pass the refresh function to the parent
      onRefreshReady(refreshFunction);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, maplibreMap, useManualRefresh, onRefreshReady, centerLat, centerLng, mapZoomLevel, refetch]);
  
  // Notify parent of loading state changes
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(loading);
    }
  }, [loading, onLoadingChange]);

  return (
    <>
      {/* Only show loading indicator if not using manual refresh (parent will handle it) */}
      {visible && loading && !useManualRefresh && (
        <LoadingIndicator loading={loading} />
      )}
    </>
  );
};
