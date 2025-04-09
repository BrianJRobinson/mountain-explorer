import React from 'react';

interface SitesDetailsProps {
  kinds: string;
  latitude: number;
  longitude: number;
  onShowMap: () => void;
}

export const SitesDetails: React.FC<SitesDetailsProps> = ({
  kinds,
  latitude,
  longitude,
  onShowMap,
}) => {
  return (
    <div className="space-y-3 flex-1">

      {/* Location */}
      <div className="flex items-center text-gray-400 group-hover:text-gray-300">
          <svg className="w-5 h-10 mr-2 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm group-hover:text-gray-200 transition-colors duration-300">
            {latitude.toFixed(6)}
          </span>
      </div>

      <div className="flex items-center text-gray-400 group-hover:text-gray-300">
          <svg className="w-5 h-10 mr-2 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm group-hover:text-gray-200 transition-colors duration-300">
            {longitude.toFixed(6)}
          </span>
      </div>      

      {/* External Links */}
      <div className="flex items-center text-gray-400 group-hover:text-gray-300">
        <svg className="w-5 h-10 mr-2 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        <div className="flex gap-2">
          <a href="#" className="text-sm hover:text-orange-400 transition-colors duration-300">
            View on Map
          </a>
        </div>
      </div>
    </div>
  );
}; 