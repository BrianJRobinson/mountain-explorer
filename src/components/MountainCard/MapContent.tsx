import React, { useEffect, useRef, useCallback, useState } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { Mountain } from '@/app/types/Mountain';
import { HotelMarkers } from '../Map/HotelMarkers';
import { loadMapState, updateMapPosition } from '@/lib/mapStateContext';

interface MapContentProps {
  mountain: Mountain;
  allMountains: Mountain[];
  showHotels: boolean;
  onMountainSelect?: (mountainName: string) => void;
  onClose: () => void;
  onRefreshReady?: (refreshFn: () => void) => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

export const MapContent: React.FC<MapContentProps> = ({
  mountain,
  allMountains,
  showHotels,
  onMountainSelect,
  onClose,
  onRefreshReady,
  onLoadingChange,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const [isLoadingMarkers, setIsLoadingMarkers] = useState(false);

  // Ref to store the mountain cluster group so we can remove it on unmount or refresh

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mountainClusterGroupRef = useRef<any>(null);
  
  // Ref to store the search area circle for debugging
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const searchAreaCircleRef = useRef<any>(null);
  
  // Debug toggle for search area circle (set to false to hide the circle)
  const SHOW_SEARCH_AREA_CIRCLE = false;

  // Add mountain markers as a separate cluster group
  const addMountainMarkers = useCallback(async (mountains: Mountain[]) => {
    if (typeof window === 'undefined') return;

    setIsLoadingMarkers(true);
    const BATCH_SIZE = 10;
    const BATCH_DELAY = 50; // ms

    // Import Leaflet and markercluster (side effect)
    const L = await import('leaflet').then(m => m.default);
    await import('leaflet.markercluster');

    // Remove previous cluster group if it exists
    if (mountainClusterGroupRef.current && map.current) {
      map.current.removeLayer(mountainClusterGroupRef.current);
      mountainClusterGroupRef.current = null;
    }

    // Create a new cluster group for mountains
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mountainClusterGroup = (L as any).markerClusterGroup({
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
        iconCreateFunction: function (cluster: any) {
        // Check if the selected mountain is in this cluster
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hasSelectedMountain = cluster.getAllChildMarkers().some((marker: any) => {
          const markerLat = marker.getLatLng().lat;
          const markerLng = marker.getLatLng().lng;
          const selectedLat = parseFloat(selectedMountain?.ukHillsDbLatitude || '0');
          const selectedLng = parseFloat(selectedMountain?.ukHillsDbLongitude || '0');
          return Math.abs(markerLat - selectedLat) < 0.0001 && Math.abs(markerLng - selectedLng) < 0.0001;
        });

        // Use orange background if selected mountain is in cluster, otherwise blue
        const backgroundColor = hasSelectedMountain ? '#f97316' : '#2563eb';
        
        return L.divIcon({
          html: `<div style="background: ${backgroundColor}; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px;">${cluster.getChildCount()}</div>`,
          className: 'mountain-cluster-icon',
          iconSize: [40, 40]
        });
      }
    });
    mountainClusterGroupRef.current = mountainClusterGroup;

    // First, add the selected mountain immediately
    const selectedMountain = mountains.find(m => m.id === mountain.id);
    if (selectedMountain && map.current) {
      const mLat = parseFloat(selectedMountain.ukHillsDbLatitude);
      const mLng = parseFloat(selectedMountain.ukHillsDbLongitude);

      // Create custom orange icon for selected mountain (proper teardrop shape)
      const selectedMountainIcon = L.divIcon({
        html: `<div style="width: 25px; height: 41px; position: relative;">
          <svg width="25" height="41" viewBox="0 0 25 41" style="position: absolute; top: 0; left: 0;">
            <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 7.9 12.5 28.5 12.5 28.5s12.5-20.6 12.5-28.5C25 5.6 19.4 0 12.5 0z" fill="#f97316" stroke="white" stroke-width="1"/>
            <circle cx="12.5" cy="12.5" r="8" fill="white"/>
            <text x="12.5" y="16" text-anchor="middle" fill="#f97316" font-size="12" font-weight="bold">★</text>
          </svg>
        </div>`,
        className: 'selected-mountain-icon',
        iconSize: [25, 41],
        iconAnchor: [12, 41]
      });

      const selectedMarker = L.marker([mLat, mLng], { icon: selectedMountainIcon })
        .bindPopup(
          () => {
            const container = document.createElement('div');
            container.className = 'text-center';
            container.innerHTML = `
              <strong>${selectedMountain.ukHillsDbName}</strong><br/>
              ${selectedMountain.Height}m - ${selectedMountain.MountainCategoryID === 12 ? 'Munro' : 'Corbett'}<br/>
            `;

            const button = document.createElement('button');
            button.className = 'px-2 py-1 mt-2 bg-orange-500 text-white rounded-md text-sm cursor-pointer hover:bg-orange-600';
            button.textContent = 'Highlight This';
            button.onclick = () => {
              if (onMountainSelect) {
                onMountainSelect(selectedMountain.ukHillsDbName);
                onClose();
              }
            };

            container.appendChild(button);
            return container;
          },
          {
            className: 'mountain-popup'
          }
        )
        .setZIndexOffset(1000);

      mountainClusterGroup.addLayer(selectedMarker);
      mountainClusterGroup.addTo(map.current);

      // Center the map and open popup immediately for selected mountain
      map.current.setView([mLat, mLng], 13);
      selectedMarker.openPopup();
    }

    // Then add all other mountains progressively
    const otherMountains = mountains.filter(m => m.id !== mountain.id);
    for (let i = 0; i < otherMountains.length; i += BATCH_SIZE) {
      const batch = otherMountains.slice(i, i + BATCH_SIZE);

      await new Promise<void>((resolve) => {
        setTimeout(() => {
          batch.forEach((m) => {
            const mLat = parseFloat(m.ukHillsDbLatitude);
            const mLng = parseFloat(m.ukHillsDbLongitude);

            const marker = L.marker([mLat, mLng])
              .bindPopup(
                () => {
                  const container = document.createElement('div');
                  container.className = 'text-center';
                  container.innerHTML = `
                    <strong>${m.ukHillsDbName}</strong><br/>
                    ${m.Height}m - ${m.MountainCategoryID === 12 ? 'Munro' : 'Corbett'}<br/>
                  `;

                  const button = document.createElement('button');
                  button.className = 'px-2 py-1 mt-2 bg-orange-500 text-white rounded-md text-sm cursor-pointer hover:bg-orange-600';
                  button.textContent = 'Highlight This';
                  button.onclick = () => {
                    if (onMountainSelect) {
                      onMountainSelect(m.ukHillsDbName);
                      onClose();
                    }
                  };

                  container.appendChild(button);
                  return container;
                },
                {
                  className: 'mountain-popup'
                }
              );

            mountainClusterGroup.addLayer(marker);
          });
          resolve();
        }, BATCH_DELAY);
      });
    }

    setIsLoadingMarkers(false);
  }, [mountain, onMountainSelect, onClose]);

  // Function to calculate radius from zoom level (same as HotelMarkers)
  const calculateRadiusFromZoom = useCallback((zoom: number): number => {
    if (zoom >= 18) return 1000;
    if (zoom >= 16) return 2000;
    if (zoom >= 14) return 5000;
    if (zoom >= 12) return 10000;
    if (zoom >= 10) return 15000;
    if (zoom >= 8) return 25000;
    if (zoom >= 6) return 35000;
    return 50000; // Max 50km for very zoomed out views
  }, []);

  // Function to update the search area circle for debugging
  const updateSearchAreaCircle = useCallback(async (centerLat: number, centerLng: number, radius: number) => {
    if (!map.current || !SHOW_SEARCH_AREA_CIRCLE) return;
    
    const L = await import('leaflet').then(m => m.default);
    
    // Remove existing circle
    if (searchAreaCircleRef.current) {
      map.current.removeLayer(searchAreaCircleRef.current);
    }
    
    // Get the map bounds to calculate viewport-based radius
    const bounds = map.current.getBounds();
    
    // Calculate the distance from center to the edge of the viewport
    const latDiff = Math.abs(bounds.getNorth() - bounds.getSouth()) / 2;
    const lngDiff = Math.abs(bounds.getEast() - bounds.getWest()) / 2;
    
    // Use the smaller dimension to create a circle that fits within the viewport
    const viewportRadius = Math.min(latDiff, lngDiff) * 111000; // Convert degrees to meters (roughly)
    
    // Use the smaller of the calculated viewport radius or the provided radius
    const finalRadius = Math.min(viewportRadius, radius);
    
    // Create new circle
    searchAreaCircleRef.current = L.circle([centerLat, centerLng], {
      radius: finalRadius,
      color: '#f97316', // Orange color
      fillColor: '#f97316',
      fillOpacity: 0.1,
      weight: 2
    }).addTo(map.current);
    
    console.log('🔍 [SEARCH AREA] Updated circle:', { 
      centerLat, 
      centerLng, 
      radius, 
      viewportRadius: Math.round(viewportRadius),
      finalRadius: Math.round(finalRadius)
    });
  }, []);

  // Initialize 2D map
  const initialize2DMap = useCallback(async () => {
    if (typeof window === 'undefined' || !mapContainer.current) return;

    const L = await import('leaflet').then(m => m.default);

    if (map.current) {
      map.current.remove();
      map.current = null;
    }

    const lat = parseFloat(mountain.ukHillsDbLatitude);
    const lng = parseFloat(mountain.ukHillsDbLongitude);

    // Load saved map state for position restoration
    const mapState = loadMapState();
    const center = mapState.center ? [mapState.center.lat, mapState.center.lng] : [lat, lng];
    const zoom = mapState.zoom || 13;

    map.current = L.map(mapContainer.current, {
      scrollWheelZoom: true,
      zoomControl: true,
      maxZoom: 18,
    }).setView(center as [number, number], zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map.current);

    map.current.on('moveend zoomend', () => {
      if (map.current) {
        const center = map.current.getCenter();
        const zoom = map.current.getZoom();
        updateMapPosition({ lat: center.lat, lng: center.lng }, zoom);
      }
    });

    // Add custom zoom control
    const zoomAllButton = L.Control.extend({
      options: { position: 'topleft' },
      onAdd: function(map: LeafletMap) {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const button = L.DomUtil.create('a', '', container);
        button.innerHTML = `
          <div class="w-[30px] h-[30px] bg-white flex items-center justify-center cursor-pointer hover:bg-gray-100" title="View All Nearby">
            <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm14 0H3v12h14V3z" clip-rule="evenodd"/>
              <path fill-rule="evenodd" d="M13 7a1 1 0 10-2 0v1H9a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd"/>
            </svg>
          </div>
        `;
        L.DomEvent.on(button, 'click', function(e: Event) {
          L.DomEvent.stopPropagation(e);
          const bounds = L.latLngBounds([]);
          allMountains.forEach(m => {
            bounds.extend([
              parseFloat(m.ukHillsDbLatitude),
              parseFloat(m.ukHillsDbLongitude)
            ]);
          });
          map.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 10
          });
        });
        return container;
      }
    });

    if (map.current) {
      map.current.addControl(new zoomAllButton());
      setTimeout(() => {
        if (map.current) {
          map.current.invalidateSize();
        }
      }, 100);

      // Add mountain markers as a cluster group
      addMountainMarkers(allMountains);
      
      // Add initial search area circle for debugging
      if (showHotels) {
        const initialRadius = calculateRadiusFromZoom(zoom);
        updateSearchAreaCircle(lat, lng, initialRadius);
      }
    }
  }, [mountain, allMountains, addMountainMarkers, showHotels, updateSearchAreaCircle, calculateRadiusFromZoom, SHOW_SEARCH_AREA_CIRCLE]);

  // Initialize map based on mode
  useEffect(() => {
    initialize2DMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      // Remove mountain cluster group
      if (map.current && mountainClusterGroupRef.current) {
        (map.current as LeafletMap).removeLayer(mountainClusterGroupRef.current);
        mountainClusterGroupRef.current = null;
      }
      // Remove any added styles
      const style = document.querySelector('style[data-mountain-marker]');
      if (style) {
        style.remove();
      }
    };
  }, [initialize2DMap]);

  return (
    <div 
      ref={mapContainer} 
      className="w-full h-[50vh] md:h-[60vh] rounded-lg overflow-hidden bg-gray-700 relative"
      onClick={(e) => e.stopPropagation()}
    >
      {/* HotelMarkers is responsible for its own cluster group */}
      {showHotels && map.current && (
        <HotelMarkers
          map={map.current}
          centerLat={parseFloat(mountain.ukHillsDbLatitude)}
          centerLng={parseFloat(mountain.ukHillsDbLongitude)}
          radius={10000}
          visible={showHotels}
          onRefreshReady={onRefreshReady}
          onLoadingChange={onLoadingChange}
          useManualRefresh={false}
          onSearchAreaChange={updateSearchAreaCircle}
        />
      )}
      {isLoadingMarkers && (
        <div className="absolute bottom-4 right-4 bg-gray-900/80 text-white text-sm px-3 py-1.5 rounded-full flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          Loading nearby mountains...
        </div>
      )}
    </div>
  );
};