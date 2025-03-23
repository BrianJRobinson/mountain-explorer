import React from 'react';

interface MountainDetailsProps {
  height: number;
  latitude: string;
  longitude: string;
  region: string;
  onShowMap: () => void;
}

export const MountainDetails: React.FC<MountainDetailsProps> = ({
  height,
  latitude,
  longitude,
  region,
  onShowMap,
}) => {
  return (
    <div className="space-y-3 flex-1">
      {/* Height */}
      <div className="flex items-center text-gray-300 group-hover:text-gray-200">
        <svg className="w-5 h-10 mr-2 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <span className="font-medium text-lg group-hover:text-gray-100">
          {height}m
        </span>
      </div>

      {/* Location */}
      <div className="flex items-center text-gray-400 group-hover:text-gray-300">
        <button
          onClick={onShowMap}
          className="flex items-center hover:text-orange-400 transition-colors cursor-pointer"
        >
          <svg className="w-5 h-10 mr-2 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm group-hover:text-gray-200 transition-colors duration-300">
            {latitude}, {longitude}
          </span>
        </button>
      </div>

      {/* Region */}
      <div className="flex items-center text-gray-400 group-hover:text-gray-300">
        <svg className="w-5 h-10 mr-2 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-sm group-hover:text-gray-200 transition-colors duration-300">
          Region {region}
        </span>
      </div>
    </div>
  );
}; 