import React, { useEffect, useRef, useCallback, useState } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import type { Map as MapLibreMap, MapOptions, Marker } from 'maplibre-gl';
import { Mountain } from '@/app/types/Mountain';
import { HotelMarkers } from '../Map/HotelMarkers';

interface MapContentProps {
  mountain: Mountain;
  allMountains: Mountain[];
  is3DMode: boolean;
  showHotels: boolean;
  onMountainSelect?: (mountainName: string) => void;
  onClose: () => void;
  onRefreshReady?: (refreshFn: () => void) => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

export const MapContent: React.FC<MapContentProps> = ({
  mountain,
  allMountains,
  is3DMode,
  showHotels,
  onMountainSelect,
  onClose,
  onRefreshReady,
  onLoadingChange,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const maplibreMap = useRef<MapLibreMap | null>(null);
  const markers3D = useRef<Marker[]>([]);
  const [isLoadingMarkers, setIsLoadingMarkers] = useState(false);

  // Add markers progressively
  const addMarkers = useCallback(async (mountains: Mountain[]) => {
    if (typeof window === 'undefined') return;

    setIsLoadingMarkers(true);
    const BATCH_SIZE = 10;
    const BATCH_DELAY = 50; // ms

    // Import libraries based on mode
    const [L, maplibregl] = await Promise.all([
      import('leaflet').then(m => m.default),
      import('maplibre-gl').then(m => m.default)
    ]);

    for (let i = 0; i < mountains.length; i += BATCH_SIZE) {
      const batch = mountains.slice(i, i + BATCH_SIZE);
      
      // Process each batch
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          batch.forEach((m) => {
            const mLat = parseFloat(m.ukHillsDbLatitude);
            const mLng = parseFloat(m.ukHillsDbLongitude);

            if (is3DMode && maplibreMap.current) {
              // Add 3D marker
              const el = document.createElement('div');
              el.className = 'mountain-marker';
              el.innerHTML = `
                <div class="w-6 h-6 bg-orange-500 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:bg-orange-600 transition-colors">
                  ${m.id === mountain.id ? '<div class="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>' : ''}
                </div>
              `;

              const popupContent = document.createElement('div');
              popupContent.className = 'text-center bg-white p-2 rounded-lg';
              popupContent.innerHTML = `
                <strong class="text-gray-900">${m.ukHillsDbName}</strong><br/>
                <span class="text-gray-700">${m.Height}m - ${m.MountainCategoryID === 12 ? 'Munro' : 'Corbett'}</span><br/>
              `;

              const button = document.createElement('button');
              button.className = 'px-2 py-1 mt-2 bg-orange-500 text-white rounded-md text-sm cursor-pointer hover:bg-orange-600';
              button.textContent = 'Show Details';
              button.onclick = () => {
                if (onMountainSelect) {
                  onMountainSelect(m.ukHillsDbName);
                  onClose();
                }
              };

              popupContent.appendChild(button);

              const popup = new maplibregl.Popup({ offset: 25 })
                .setDOMContent(popupContent);

              const marker = new maplibregl.Marker(el)
                .setLngLat([mLng, mLat])
                .setPopup(popup)
                .addTo(maplibreMap.current);

              markers3D.current.push(marker);

              if (m.id === mountain.id) {
                marker.togglePopup();
              }
            } else if (!is3DMode && map.current) {
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
  }, [is3DMode, mountain, onMountainSelect, onClose]);

  // Initialize 3D map
  const initialize3DMap = useCallback(async () => {
    if (typeof window === 'undefined' || !mapContainer.current) return;

    const maplibregl = await import('maplibre-gl').then(m => m.default);

    // Clean up existing maps
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
    if (maplibreMap.current) {
      markers3D.current.forEach(marker => marker.remove());
      markers3D.current = [];
      maplibreMap.current.remove();
      maplibreMap.current = null;
    }

    const lat = parseFloat(mountain.ukHillsDbLatitude);
    const lng = parseFloat(mountain.ukHillsDbLongitude);

    // Add styles for 3D markers
    const style = document.createElement('style');
    style.setAttribute('data-mountain-marker', 'true');
    style.textContent = `
      .mountain-marker {
        cursor: pointer;
        width: 24px;
        height: 24px;
        transform: translate(-50%, -50%);
      }
      .mountain-marker div {
        transform-origin: center;
        transform: rotateX(45deg);
        transition: transform 0.3s ease;
      }
      .mountain-marker:hover div {
        transform: rotateX(45deg) scale(1.1);
      }
    `;
    document.head.appendChild(style);

    const mapOptions: MapOptions = {
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: ' OpenStreetMap contributors'
          },
          'terrain-rgb': {
            type: 'raster-dem',
            tiles: [
              'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            maxzoom: 14,
            encoding: 'terrarium'
          }
        },
        layers: [
          {
            id: 'osm-layer',
            type: 'raster',
            source: 'osm',
            paint: {
              'raster-opacity': 1
            }
          }
        ],
        terrain: {
          source: 'terrain-rgb',
          exaggeration: 1.2
        }
      },
      center: [lng, lat],
      zoom: 12,
      pitch: 60,
      bearing: 30
    };

    maplibreMap.current = new maplibregl.Map(mapOptions);

    // Wait for map to load
    maplibreMap.current?.on('load', () => {
      if (!maplibreMap.current) return;
      
      maplibreMap.current.addLayer({
        id: 'fog',
        type: 'background',
        paint: {
          'background-color': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 'rgba(255,255,255,0.9)',
            5, 'rgba(255,255,255,0.6)',
            10, 'rgba(255,255,255,0.3)',
            15, 'rgba(255,255,255,0.1)'
          ]
        }
      });

      // Add markers progressively after terrain is loaded
      addMarkers(allMountains);

      // Force a resize to ensure proper rendering
      maplibreMap.current.resize();
    });

    // Add terrain controls
    const terrainControls = document.createElement('div');
    terrainControls.className = 'maplibre-ctrl maplibre-ctrl-group';
    terrainControls.style.cssText = 'position: absolute; bottom: 10px; left: 10px; margin: 0;';
    terrainControls.innerHTML = `
      <div class="bg-white rounded-lg shadow-lg" style="touch-action: none;">
        <div class="flex items-center gap-3 p-2" style="pointer-events: auto;">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-gray-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z" />
            </svg>
            <span class="text-xs text-gray-600 font-medium">Tilt</span>
          </div>
          <div class="relative w-32" style="touch-action: none;">
            <input 
              type="range" 
              min="0" 
              max="85" 
              step="1" 
              value="60" 
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style="
                pointer-events: auto;
                touch-action: none;
                -webkit-appearance: none;
                appearance: none;
              "
            />
            <style>
              input[type='range']::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 16px;
                height: 16px;
                background: #f97316;
                border-radius: 50%;
                cursor: pointer;
                border: 2px solid white;
                box-shadow: 0 1px 3px rgba(0,0,0,0.3);
              }
              input[type='range']::-moz-range-thumb {
                width: 16px;
                height: 16px;
                background: #f97316;
                border-radius: 50%;
                cursor: pointer;
                border: 2px solid white;
                box-shadow: 0 1px 3px rgba(0,0,0,0.3);
              }
              input[type='range']:focus {
                outline: none;
              }
              input[type='range']::-webkit-slider-runnable-track {
                background: #e5e7eb;
                border-radius: 0.5rem;
                height: 0.5rem;
              }
              input[type='range']::-moz-range-track {
                background: #e5e7eb;
                border-radius: 0.5rem;
                height: 0.5rem;
              }
            </style>
          </div>
          <button 
            class="p-1.5 hover:bg-gray-100 rounded-md transition-colors" 
            title="Reset View"
          >
            <svg class="w-4 h-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    // Add click handler for reset button
    terrainControls.querySelector('button')?.addEventListener('click', () => {
      if (maplibreMap.current) {
        maplibreMap.current.easeTo({
          pitch: 60,
          bearing: 30,
          zoom: 12,
          duration: 1500
        });
      }
    });

    // Add change handler for pitch slider
    const pitchSlider = terrainControls.querySelector('input[type="range"]');
    pitchSlider?.addEventListener('input', (e) => {
      if (maplibreMap.current) {
        const pitch = parseFloat((e.target as HTMLInputElement).value);
        maplibreMap.current.easeTo({
          pitch: pitch,
          duration: 0
        });
      }
    });

    // Add the controls directly to the map container
    mapContainer.current.appendChild(terrainControls);
  }, [mountain, allMountains, addMarkers]);

  // Initialize 2D map
  const initialize2DMap = useCallback(async () => {
    if (typeof window === 'undefined' || !mapContainer.current) return;

    const L = await import('leaflet').then(m => m.default);

    // Clean up existing maps
    if (maplibreMap.current) {
      markers3D.current.forEach(marker => marker.remove());
      markers3D.current = [];
      maplibreMap.current.remove();
      maplibreMap.current = null;
    }
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
    
    const lat = parseFloat(mountain.ukHillsDbLatitude);
    const lng = parseFloat(mountain.ukHillsDbLongitude);

    // Initialize map centered on the current mountain with closer zoom
    map.current = L.map(mapContainer.current, {
      scrollWheelZoom: true,
      zoomControl: true,
      maxZoom: 18, // Set a max zoom level to avoid errors
    }).setView([lat, lng], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map.current);

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
    if (is3DMode) {
      initialize3DMap();
    } else {
      initialize2DMap();
    }

    return () => {
      if (is3DMode && maplibreMap.current) {
        markers3D.current.forEach(marker => marker.remove());
        markers3D.current = [];
        maplibreMap.current.remove();
        maplibreMap.current = null;
      } else if (map.current) {
        map.current.remove();
        map.current = null;
      }
      // Remove any added styles
      const style = document.querySelector('style[data-mountain-marker]');
      if (style) {
        style.remove();
      }
    };
  }, [is3DMode, initialize3DMap, initialize2DMap]);

  return (
    <div 
      ref={mapContainer} 
      className="w-full h-[50vh] md:h-[60vh] rounded-lg overflow-hidden bg-gray-700 relative"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Conditionally render HotelMarkers with the correct props */}
      {showHotels && (map.current || maplibreMap.current) && (
        <HotelMarkers
          map={map.current}
          maplibreMap={maplibreMap.current}
          is3DMode={is3DMode}
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