import React, { useState, useEffect } from 'react';
import { loadMapLibraries, isMapLibrariesLoaded } from '@/lib/mapLibraries';

interface MapLoaderProps {
  children: React.ReactNode;
}

export const MapLoader: React.FC<MapLoaderProps> = ({ children }) => {
  const [librariesReady, setLibrariesReady] = useState(isMapLibrariesLoaded());
  const [loadingError, setLoadingError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!librariesReady) {
      loadMapLibraries()
        .then(() => {
          if (isMounted) {
            console.log('[SitesMapLoader] Libraries loaded successfully');
            setLibrariesReady(true);
          }
        })
        .catch((error) => {
          if (isMounted) {
            console.error('[SitesMapLoader] Failed to load map libraries:', error);
            setLoadingError(error);
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, [librariesReady]);

  if (loadingError) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        Error loading map components: {loadingError.message}
      </div>
    );
  }

  if (!librariesReady) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Loading map...
      </div>
    );
  }

  return <>{children}</>;
}; 