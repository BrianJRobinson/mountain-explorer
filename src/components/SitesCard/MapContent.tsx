import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Site } from '@/app/types/Sites';
import type { Map as LeafletMap } from 'leaflet';
import { HotelMarkers } from '../Map/HotelMarkers';

interface MapContentProps {
  site: Site;
  allSites: Site[];
  showHotels: boolean;
  onSiteSelect?: (siteName: string) => void;
  onClose: () => void;
  onRefreshReady?: (refreshFn: () => void) => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

export const MapContent: React.FC<MapContentProps> = ({
  site,
  allSites,
  showHotels,
  onSiteSelect,
  onClose,
  onRefreshReady,
  onLoadingChange,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const [isLoadingMarkers, setIsLoadingMarkers] = useState(false);

  // Ref to store the site cluster group so we can remove it on unmount or refresh
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const siteClusterGroupRef = useRef<any>(null);
  
  // Ref to store the search area circle for debugging
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const searchAreaCircleRef = useRef<any>(null);

  // Add site markers as a separate cluster group
  const addSiteMarkers = useCallback(async (sites: Site[]) => {
    if (typeof window === 'undefined') return;

    setIsLoadingMarkers(true);
    const BATCH_SIZE = 10;
    const BATCH_DELAY = 50; // ms

    // Import Leaflet and markercluster (side effect)
    const L = await import('leaflet').then(m => m.default);
    await import('leaflet.markercluster');

    // Remove previous cluster group if it exists
    if (siteClusterGroupRef.current && map.current) {
      map.current.removeLayer(siteClusterGroupRef.current);
      siteClusterGroupRef.current = null;
    }

    // Create a new cluster group for sites
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const siteClusterGroup = (L as any).markerClusterGroup({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      iconCreateFunction: function (cluster: any) {
        // Check if the selected site is in this cluster
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hasSelectedSite = cluster.getAllChildMarkers().some((marker: any) => {
          const markerLat = marker.getLatLng().lat;
          const markerLng = marker.getLatLng().lng;
          const selectedLat = selectedSite?.latitude || 0;
          const selectedLng = selectedSite?.longitude || 0;
          return Math.abs(markerLat - selectedLat) < 0.0001 && Math.abs(markerLng - selectedLng) < 0.0001;
        });

        // Use orange background if selected site is in cluster, otherwise blue
        const backgroundColor = hasSelectedSite ? '#f97316' : '#2563eb';
        
        return L.divIcon({
          html: `<div style="background: ${backgroundColor}; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px;">${cluster.getChildCount()}</div>`,
          className: 'site-cluster-icon',
          iconSize: [40, 40]
        });
      }
    });
    siteClusterGroupRef.current = siteClusterGroup;

    // First, add the selected site immediately
    const selectedSite = sites.find(s => s.id === site.id);
    if (selectedSite && map.current) {
      const sLat = selectedSite.latitude;
      const sLng = selectedSite.longitude;

      // Create custom orange icon for selected site (proper teardrop shape)
      const selectedSiteIcon = L.divIcon({
        html: `<div style="width: 25px; height: 41px; position: relative;">
          <svg width="25" height="41" viewBox="0 0 25 41" style="position: absolute; top: 0; left: 0;">
            <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 7.9 12.5 28.5 12.5 28.5s12.5-20.6 12.5-28.5C25 5.6 19.4 0 12.5 0z" fill="#f97316" stroke="white" stroke-width="1"/>
            <circle cx="12.5" cy="12.5" r="8" fill="white"/>
            <text x="12.5" y="16" text-anchor="middle" fill="#f97316" font-size="12" font-weight="bold">★</text>
          </svg>
        </div>`,
        className: 'selected-site-icon',
        iconSize: [25, 41],
        iconAnchor: [12, 41]
      });

      const selectedMarker = L.marker([sLat, sLng], { icon: selectedSiteIcon })
        .bindPopup(
          () => {
            const container = document.createElement('div');
            container.className = 'text-center';
            container.innerHTML = `
              <strong>${selectedSite.name}</strong><br/>
              <div style="white-space: normal; word-wrap: break-word; max-width: 200px; margin: 0 auto; font-size: 0.8rem; color: #6b7280;">${selectedSite.kinds}</div>
            `;

            const button = document.createElement('button');
            button.className = 'px-2 py-1 mt-2 bg-orange-500 text-white rounded-md text-sm cursor-pointer hover:bg-orange-600';
            button.textContent = 'Show Details';
            button.onclick = () => {
              if (onSiteSelect) {
                onSiteSelect(selectedSite.name);
                onClose();
              }
            };

            container.appendChild(button);
            return container;
          },
          {
            className: 'site-popup'
          }
        )
        .setZIndexOffset(1000);

      siteClusterGroup.addLayer(selectedMarker);
      siteClusterGroup.addTo(map.current);

      // Center the map and open popup immediately for selected site
      map.current.setView([sLat, sLng], 13);
      selectedMarker.openPopup();
    }

    // Then add all other sites progressively
    const otherSites = sites.filter(s => s.id !== site.id);
    for (let i = 0; i < otherSites.length; i += BATCH_SIZE) {
      const batch = otherSites.slice(i, i + BATCH_SIZE);

      await new Promise<void>((resolve) => {
        setTimeout(() => {
          batch.forEach((s) => {
            const sLat = s.latitude;
            const sLng = s.longitude;

            const marker = L.marker([sLat, sLng])
              .bindPopup(
                () => {
                  const container = document.createElement('div');
                  container.className = 'text-center';
                  container.innerHTML = `
                    <strong>${s.name}</strong><br/>
                    <div style="white-space: normal; word-wrap: break-word; max-width: 200px; margin: 0 auto; font-size: 0.8rem; color: #6b7280;">${s.kinds}</div>
                  `;

                  const button = document.createElement('button');
                  button.className = 'px-2 py-1 mt-2 bg-orange-500 text-white rounded-md text-sm cursor-pointer hover:bg-orange-600';
                  button.textContent = 'Show Details';
                  button.onclick = () => {
                    if (onSiteSelect) {
                      onSiteSelect(s.name);
                      onClose();
                    }
                  };

                  container.appendChild(button);
                  return container;
                },
                {
                  className: 'site-popup'
                }
              );

            siteClusterGroup.addLayer(marker);
          });
          resolve();
        }, BATCH_DELAY);
      });
    }

    setIsLoadingMarkers(false);
  }, [site, onSiteSelect, onClose]);

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
    if (!map.current) return;
    
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

  const initialize2DMap = useCallback(async () => {
    console.log('[MapContent] Attempting to initialize 2D map...');
    
    const L = (await import('leaflet')).default;
    if (!L) {
      console.error('[MapContent] Leaflet (L) failed to import!');
      return;
    }

    if (!mapContainer.current) {
       console.error('[MapContent] mapContainer ref is not available!');
       return;
    }
    console.log('[MapContent] Leaflet imported, container ready. Initializing 2D map.');

    if (map.current) {
      map.current.remove();
      map.current = null;
    }

    const lat = site.latitude;
    const lng = site.longitude;

    map.current = L.map(mapContainer.current, {
      scrollWheelZoom: true,
      zoomControl: true,
      maxZoom: 18,
    }).setView([lat, lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map.current);

    // Add custom zoom control
    const zoomAllButton = L.Control.extend({
      options: { position: 'topleft' },
      onAdd: function (mapInstance: LeafletMap) {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const button = L.DomUtil.create('a', '', container);
        button.innerHTML = `<div class="w-[30px] h-[30px] bg-white flex items-center justify-center cursor-pointer hover:bg-gray-100" title="View All Nearby"><svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm14 0H3v12h14V3z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M13 7a1 1 0 10-2 0v1H9a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd"/></svg></div>`;
        L.DomEvent.on(button, 'click', (e: Event) => {
          L.DomEvent.stopPropagation(e);
          const bounds = L.latLngBounds(allSites.map(s => [s.latitude, s.longitude]));
          mapInstance.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
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

      // Add site markers as a cluster group
      addSiteMarkers(allSites);
      
      // Add initial search area circle for debugging
      if (showHotels) {
        const initialRadius = calculateRadiusFromZoom(13); // Default zoom level
        updateSearchAreaCircle(lat, lng, initialRadius);
      }
    }

  }, [site, allSites, addSiteMarkers, showHotels, updateSearchAreaCircle, calculateRadiusFromZoom]);

  useEffect(() => {
    (async () => {
      await initialize2DMap();
    })();

    return () => {
      console.log('[MapContent] Cleaning up map instances.');
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      // Remove site cluster group
      if (map.current && siteClusterGroupRef.current) {
        (map.current as LeafletMap).removeLayer(siteClusterGroupRef.current);
        siteClusterGroupRef.current = null;
      }
      // Remove any added styles
      const style = document.querySelector('style[data-site-marker]');
      if (style) {
        style.remove();
      }
    };
  }, [initialize2DMap]);

  return (
    <div 
      ref={mapContainer} 
      className="w-full h-full rounded-lg overflow-hidden bg-gray-700 relative"
      onClick={(e) => e.stopPropagation()}
    >
      {/* HotelMarkers is responsible for its own cluster group */}
      {showHotels && map.current && (
        <HotelMarkers
          map={map.current}
          centerLat={site.latitude}
          centerLng={site.longitude}
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
          Loading nearby sites...
        </div>
      )}
    </div>
  );
}; 