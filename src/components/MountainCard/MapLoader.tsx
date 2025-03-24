import React, { useEffect, useState } from 'react';
import { loadMapLibraries, isMapLibrariesLoaded } from '@/lib/mapLibraries';

interface MapLoaderProps {
  children: React.ReactNode;
}

export const MapLoader: React.FC<MapLoaderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(!isMapLibrariesLoaded());

  useEffect(() => {
    if (isMapLibrariesLoaded()) {
      setIsLoading(false);
      return;
    }

    const initializeLibraries = async () => {
      await loadMapLibraries();
      setIsLoading(false);
    };

    initializeLibraries();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-[50vh] md:h-[60vh] rounded-lg overflow-hidden bg-gray-700 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-pulse bg-gray-600 w-full h-full" />
          <div className="absolute">
            <svg className="animate-spin h-8 w-8 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}; 