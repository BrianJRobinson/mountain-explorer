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

  // Add markers progressively
  const addMarkers = useCallback(async (mountains: Mountain[]) => {
    if (typeof window === 'undefined') return;

    setIsLoadingMarkers(true);
    const BATCH_SIZE = 10;
    const BATCH_DELAY = 50; // ms

    // Import libraries based on mode
    const [L] = await Promise.all([
      import('leaflet').then(m => m.default),
    ]);

    for (let i = 0; i < mountains.length; i += BATCH_SIZE) {
      const batch = mountains.slice(i, i + BATCH_SIZE);
      
      // Process each batch
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          batch.forEach((m) => {
            const mLat = parseFloat(m.ukHillsDbLatitude);
            const mLng = parseFloat(m.ukHillsDbLongitude);
            
            if (map.current) {
              // Add 2D marker
              const marker = L.marker([mLat, mLng])
                .addTo(map.current)
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

              if (m.id === mountain.id) {
                marker.setZIndexOffset(1000);
                marker.openPopup();
              }
            }
          });
          resolve();
        }, BATCH_DELAY);
      });
    }
    setIsLoadingMarkers(false);
  }, [mountain, onMountainSelect, onClose]);


  const lat = parseFloat(mountain.ukHillsDbLatitude);
  const lng = parseFloat(mountain.ukHillsDbLongitude);

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

    console.log('🗺️ [MAP RESTORE] Restoring 2D map position:', { center, zoom, saved: !!mapState.center });

    // Initialize map centered on saved position or current mountain with closer zoom
    map.current = L.map(mapContainer.current, {
      scrollWheelZoom: true,
      zoomControl: true,
      maxZoom: 18, // Set a max zoom level to avoid errors
    }).setView(center as [number, number], zoom);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map.current);

    // Add event listeners to save map position when user moves or zooms
    map.current.on('moveend zoomend', () => {
      if (map.current) {
        const center = map.current.getCenter();
        const zoom = map.current.getZoom();
        updateMapPosition({ lat: center.lat, lng: center.lng }, zoom);
      }
    });

    // Add custom zoom control
    const zoomAllButton = L.Control.extend({
      options: {
        position: 'topleft'
      },

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
          // Create bounds object to fit all markers
          const bounds = L.latLngBounds([]);
          allMountains.forEach(m => {
            bounds.extend([
              parseFloat(m.ukHillsDbLatitude),
              parseFloat(m.ukHillsDbLongitude)
            ]);
          });
          // Fit the map to show all markers with some padding
          map.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 10
          });
        });

        return container;
      }
    });

    // Add the zoom control to the map
    if (map.current) {
      map.current.addControl(new zoomAllButton());

      // Force a resize after a short delay to ensure the container is visible
      setTimeout(() => {
        if (map.current) {
          map.current.invalidateSize();
        }
      }, 100);

      // Add markers progressively
      addMarkers(allMountains);
    }
  }, [mountain, allMountains, addMarkers]);

  // Initialize map based on mode
  useEffect(() => {
    initialize2DMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
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
      {/* Conditionally render HotelMarkers with the correct props */}
      {showHotels && map.current && (
        <HotelMarkers
          map={map.current}
          centerLat={parseFloat(mountain.ukHillsDbLatitude)}
          centerLng={parseFloat(mountain.ukHillsDbLongitude)}
          radius={10000} // Default 10km radius
          visible={showHotels}
          onRefreshReady={onRefreshReady}
          onLoadingChange={onLoadingChange}
          useManualRefresh={true} // Controlled by parent component
        />
      )}
      
      {isLoadingMarkers && (
        <div className="absolute bottom-4 right-4 bg-gray-900/80 text-white text-sm px-3 py-1.5 rounded-full">
          Loading markers...
        </div>
      )}
    </div>
  );
};