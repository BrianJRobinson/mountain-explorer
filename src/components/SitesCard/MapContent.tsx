import React, { useRef, useEffect, useCallback } from 'react';
import { Site } from '@/app/types/Sites';
import type { Map as LeafletMap } from 'leaflet';

interface MapContentProps {
  site: Site;
  allSites: Site[];
  onSiteSelect?: (siteName: string) => void;
  onClose: () => void;
}

export const MapContent: React.FC<MapContentProps> = ({
  site,
  allSites,
  onSiteSelect,
  onClose,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);

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
    }).setView([lat, lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map.current);

    allSites.forEach((s) => {
      if (!map.current) return;
      const marker = L.marker([s.latitude, s.longitude])
        .addTo(map.current)
        .bindPopup(
          `<div class="text-center">
            <strong>${s.name}</strong><br/>
            <div style="white-space: normal; word-wrap: break-word; max-width: 200px; margin: 0 auto; font-size: 0.8rem; color: #6b7280;">${s.kinds}</div>
            <button 
              onclick="window.dispatchEvent(new CustomEvent('site-selected-map', { detail: '${s.name}' }))"
              class="px-2 py-1 mt-2 bg-orange-500 text-white rounded-md text-sm cursor-pointer hover:bg-orange-600"
            >
              Show Details
            </button>
          </div>`,
          { className: 'site-popup' }
        );

      if (s.id === site.id) {
        marker.setZIndexOffset(1000);
        marker.openPopup();
      }
    });

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
    }

    setTimeout(() => {
        console.log('[MapContent] Invalidating 2D map size');
        map.current?.invalidateSize()
    }, 100);

  }, [site, allSites]);

  useEffect(() => {
    (async () => {
      await initialize2DMap();
    })();

    return () => {
      console.log('[MapContent] Cleaning up map instances.');
      map.current?.remove();
      map.current = null;
    };
  }, [initialize2DMap]);

  useEffect(() => {
    const handleSiteSelected = (event: CustomEvent) => {
      console.log('[MapContent] site-selected-map event caught:', event.detail);
      if (onSiteSelect) {
        onSiteSelect(event.detail);
        onClose();
      }
    };

    window.addEventListener('site-selected-map', handleSiteSelected as EventListener);
    return () => {
      window.removeEventListener('site-selected-map', handleSiteSelected as EventListener);
    };
  }, [onSiteSelect, onClose]);

  return <div ref={mapContainer} className="w-full h-full rounded-lg overflow-hidden bg-gray-700" />;
}; 