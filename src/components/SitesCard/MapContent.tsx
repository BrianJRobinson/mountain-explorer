import React, { useRef, useEffect, useCallback } from 'react';
import { Site } from '@/app/types/Sites';
import type { Map as LeafletMap } from 'leaflet';
import type { Map as MapLibreMap, Marker } from 'maplibre-gl';

interface MapContentProps {
  site: Site;
  allSites: Site[];
  is3DMode: boolean;
  onSiteSelect?: (siteName: string) => void;
  onClose: () => void;
}

export const MapContent: React.FC<MapContentProps> = ({
  site,
  allSites,
  is3DMode,
  onSiteSelect,
  onClose,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const maplibreMap = useRef<MapLibreMap | null>(null);
  const markers3D = useRef<Marker[]>([]);

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

  const initialize3DMap = useCallback(async () => {
    console.log('[MapContent] Attempting to initialize 3D map...');

    const maplibregl = (await import('maplibre-gl')).default;
    if (!maplibregl) {
      console.error('[MapContent] MapLibre GL JS failed to import!');
      return;
    }
     if (!mapContainer.current) {
       console.error('[MapContent] mapContainer ref is not available!');
       return;
    }
    console.log('[MapContent] MapLibre imported, container ready. Initializing 3D map.');

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

    const lat = site.latitude;
    const lng = site.longitude;

    const currentMap = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'osm-layer',
            type: 'raster',
            source: 'osm',
            paint: { 'raster-opacity': 1 }
          }
        ]
      },
      center: [lng, lat],
      zoom: 14,
      pitch: 45,
      bearing: 0
    });
    maplibreMap.current = currentMap;

    currentMap.on('load', () => {
      if (!currentMap) return;
      console.log('[MapContent] 3D map loaded event triggered.');
      allSites.forEach((s) => {
        if (!currentMap) return;
        const el = document.createElement('div');
        el.className = 'w-3 h-3 bg-blue-500 rounded-full border border-white';
        const marker = new maplibregl.Marker(el)
          .setLngLat([s.longitude, s.latitude])
          .addTo(currentMap);
          
        const popupContent = `<div class="text-center p-1"><strong class="text-xs">${s.name}</strong><br/><button onclick="window.dispatchEvent(new CustomEvent('site-selected-map', { detail: '${s.name}' }))" class="mt-1 px-1 py-0.5 bg-orange-500 text-white rounded text-xs">Details</button></div>`;
        const popup = new maplibregl.Popup({ offset: 15, closeButton: false }).setHTML(popupContent);
        marker.setPopup(popup);

        markers3D.current.push(marker);

        if (s.id === site.id) {
          marker.togglePopup();
          currentMap.flyTo({ center: [s.longitude, s.latitude], zoom: 15 });
        }
      });
      console.log('[MapContent] Resizing 3D map after load.');
      currentMap.resize();
    });

  }, [site, allSites]);

  useEffect(() => {
    console.log(`[MapContent] Initialization effect running. is3DMode: ${is3DMode}`);
    (async () => {
      if (is3DMode) {
        await initialize3DMap();
      } else {
        await initialize2DMap();
      }
    })();

    return () => {
      console.log('[MapContent] Cleaning up map instances.');
      map.current?.remove();
      map.current = null;
      maplibreMap.current?.remove();
      maplibreMap.current = null;
      markers3D.current.forEach(marker => marker.remove());
      markers3D.current = [];
    };
  }, [is3DMode, initialize2DMap, initialize3DMap]);

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