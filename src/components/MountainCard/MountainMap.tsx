import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Mountain } from '@/app/types/Mountain';
import { MapLoader } from './MapLoader';
import { MapContent } from './MapContent';
import { ToggleButton } from '../shared/ToggleButton';

interface MountainMapProps {
  isOpen: boolean;
  mountain: Mountain;
  allMountains: Mountain[];
  onMountainSelect?: (mountainName: string) => void;
  onClose: () => void;
}

export const MountainMap: React.FC<MountainMapProps> = ({
  isOpen,
  mountain,
  allMountains,
  onMountainSelect,
  onClose,
}) => {
  // Generate a unique key for this mountain's map state
  const storageKey = `mountain-map-${mountain.id}`;
  
  // Initialize state from sessionStorage
  const [is3DMode, setIs3DMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed.is3D || false;
        } catch {
          return false;
        }
      }
    }
    return false;
  });
  
  const [showHotels, setShowHotels] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed.hotels || false;
        } catch {
          return false;
        }
      }
    }
    return false;
  });
  
  const [isHotelLoading, setIsHotelLoading] = useState(false);
  const refreshHotelsRef = useRef<(() => void) | null>(null);
  
  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const state = {
        is3D: is3DMode,
        hotels: showHotels
      };
      sessionStorage.setItem(storageKey, JSON.stringify(state));
    }
  }, [is3DMode, showHotels, storageKey]);

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-gray-800 rounded-xl shadow-xl border border-orange-500/20 w-full max-w-4xl">
        <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">{mountain.ukHillsDbName} - Location Map</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-300">3D</span>
              <ToggleButton
                isToggled={is3DMode}
                onToggle={() => setIs3DMode(!is3DMode)}
                size="sm"
                label={is3DMode ? 'Switch to 2D view' : 'Switch to 3D view'}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-300">Hotels</span>
              <ToggleButton
                isToggled={showHotels}
                onToggle={() => setShowHotels(!showHotels)}
                size="sm"
                label={showHotels ? 'Hide Hotels' : 'Show Hotels'}
              />
              {showHotels && (
                <button
                  onClick={() => {
                    if (refreshHotelsRef.current) {
                      setIsHotelLoading(true);
                      refreshHotelsRef.current();
                    }
                  }}
                  disabled={isHotelLoading}
                  className={`flex items-center justify-center w-6 h-6 rounded-md transition-colors ${
                    isHotelLoading 
                      ? 'bg-purple-700 text-white cursor-not-allowed' 
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                  title="Refresh hotel data"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="currentColor" 
                    className={`w-3.5 h-3.5 ${isHotelLoading ? 'animate-spin' : ''}`}
                  >
                    <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-3.183a.75.75 0 100 1.5h4.992a.75.75 0 00.75-.75V4.356a.75.75 0 00-1.5 0v3.18l-1.9-1.9A9 9 0 003.306 9.67a.75.75 0 101.45.388zm15.408 3.352a.75.75 0 00-.919.53 7.5 7.5 0 01-12.548 3.364l-1.902-1.903h3.183a.75.75 0 000-1.5H2.984a.75.75 0 00-.75.75v4.992a.75.75 0 001.5 0v-3.18l1.9 1.9a9 9 0 0015.059-4.035.75.75 0 00-.53-.918z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-4">
          <MapLoader>
            <MapContent
              mountain={mountain}
              allMountains={allMountains}
              is3DMode={is3DMode}
              showHotels={showHotels}
              onMountainSelect={onMountainSelect}
              onClose={onClose}
              onRefreshReady={(refreshFn) => {
                refreshHotelsRef.current = refreshFn;
              }}
              onLoadingChange={setIsHotelLoading}
            />
          </MapLoader>
        </div>
      </div>
    </div>,
    document.body
  );
}; 