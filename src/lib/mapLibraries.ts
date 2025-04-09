let librariesLoaded = false;

export const loadMapLibraries = async () => {
  console.log('[loadMapLibraries] Starting to load map libraries, librariesLoaded:', librariesLoaded);
  
  if (librariesLoaded || typeof window === 'undefined') {
    console.log('[loadMapLibraries] Libraries already loaded or window is undefined, returning early');
    return {
      leaflet: undefined,
      maplibre: undefined
    };
  }

  try {
    console.log('[loadMapLibraries] Importing leaflet and maplibre-gl');
    // Load libraries
    const [leaflet, maplibre] = await Promise.all([
      import('leaflet'),
      import('maplibre-gl')
    ]);
    
    console.log('[loadMapLibraries] Libraries imported successfully:', { 
      leafletLoaded: !!leaflet, 
      maplibreLoaded: !!maplibre 
    });
    
    // Add Leaflet CSS
    const leafletCSS = document.createElement('link');
    leafletCSS.rel = 'stylesheet';
    leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(leafletCSS);
    console.log('[loadMapLibraries] Added Leaflet CSS');

    // Add MapLibre CSS
    const maplibreCSS = document.createElement('link');
    maplibreCSS.rel = 'stylesheet';
    maplibreCSS.href = 'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css';
    document.head.appendChild(maplibreCSS);
    console.log('[loadMapLibraries] Added MapLibre CSS');

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
    console.log('[loadMapLibraries] Added Leaflet icon fix script');

    librariesLoaded = true;
    console.log('[loadMapLibraries] Libraries loaded successfully, returning');
    return {
      leaflet: leaflet.default,
      maplibre: maplibre.default
    };
  } catch (error) {
    console.error('[loadMapLibraries] Error loading map libraries:', error);
    return {
      leaflet: undefined,
      maplibre: undefined
    };
  }
};

export const isMapLibrariesLoaded = () => librariesLoaded; 