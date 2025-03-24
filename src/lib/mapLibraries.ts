let librariesLoaded = false;

export const loadMapLibraries = async () => {
  if (librariesLoaded || typeof window === 'undefined') return;

  try {
    // Load Leaflet
    await import('leaflet');
    // Load MapLibre GL
    await import('maplibre-gl');
    
    // Add Leaflet CSS
    const leafletCSS = document.createElement('link');
    leafletCSS.rel = 'stylesheet';
    leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(leafletCSS);

    // Add MapLibre CSS
    const maplibreCSS = document.createElement('link');
    maplibreCSS.rel = 'stylesheet';
    maplibreCSS.href = 'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css';
    document.head.appendChild(maplibreCSS);

    // Fix Leaflet icon paths
    const script = document.createElement('script');
    script.textContent = `
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
    `;
    document.head.appendChild(script);

    librariesLoaded = true;
  } catch (error) {
    console.error('Error loading map libraries:', error);
  }
};

export const isMapLibrariesLoaded = () => librariesLoaded; 