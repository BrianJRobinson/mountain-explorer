import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Site } from '@/app/types/Sites';
import { MapLoader } from './MapLoader';
import { MapContent } from './MapContent';
import { ToggleButton } from '../shared/ToggleButton';

interface SitesMapProps {
  isOpen: boolean;
  site: Site;
  allSites: Site[];
  onSiteSelect?: (siteName: string) => void;
  onClose: () => void;
}

export const SitesMap: React.FC<SitesMapProps> = ({
  isOpen,
  site,
  allSites,
  onSiteSelect,
  onClose,
}) => {
  const [is3DMode, setIs3DMode] = useState(false);

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
        <div className="p-4 border-b border-gray-700/50 flex items-center justify-between gap-4">
          <h3 
            className="text-lg font-medium text-white truncate"
            style={{ fontSize: site.name.length > 50 ? '0.9rem' : '1.125rem' }}
            title={site.name}
          >
            {site.name} - Location Map
          </h3>
          <div className="flex items-center flex-shrink-0 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-300">3D</span>
              <ToggleButton
                isToggled={is3DMode}
                onToggle={() => setIs3DMode(!is3DMode)}
                size="sm"
                label={is3DMode ? 'Switch to 2D view' : 'Switch to 3D view'}
              />
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Close map"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-4 h-[70vh]">
          <MapLoader>
            <MapContent
              site={site}
              allSites={allSites}
              is3DMode={is3DMode}
              onSiteSelect={onSiteSelect}
              onClose={onClose}
            />
          </MapLoader>
        </div>
      </div>
    </div>,
    document.body
  );
}; 