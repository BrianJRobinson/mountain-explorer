let librariesLoaded = false;

export const loadMapLibraries = async () => {
  // Starting to load map libraries
  
  if (librariesLoaded || typeof window === 'undefined') {
    // Libraries already loaded or window is undefined
    return {
      leaflet: undefined,
    };
  }

  try {
    // Importing leaflet
    // Load libraries
    const [leaflet] = await Promise.all([
      import('leaflet'),
    ]);
    
    // Libraries imported successfully
    
    // Add Leaflet CSS
    const leafletCSS = document.createElement('link');
    leafletCSS.rel = 'stylesheet';
    leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(leafletCSS);
    // Added Leaflet CSS

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
    // Added Leaflet icon fix script

    librariesLoaded = true;
    // Libraries loaded successfully
    return {
      leaflet: leaflet.default,
    };
  } catch (error) {
    console.error('[loadMapLibraries] Error loading map libraries:', error);
    return {
      leaflet: undefined
    };
  }
};

export const isMapLibrariesLoaded = () => librariesLoaded; 