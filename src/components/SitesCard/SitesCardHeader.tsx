import React from 'react';
import { ToggleButton } from '../shared/ToggleButton';

interface SitesCardHeaderProps {
  name: string;
  kinds: string;
  isCompleted: boolean;
  isUpdating: boolean;
  showToggle: boolean;
  onToggleCompletion: () => void;
}

const getMainCategory = (kinds: string) => {
  return kinds.split(',')[0].trim();
};

const getCategoryImage = (kinds: string) => {
  // Default image for now, can be customized based on site types later
  return '/site-default.jpg';
};

export const SitesCardHeader: React.FC<SitesCardHeaderProps> = ({
  name,
  kinds,
  isCompleted,
  isUpdating,
  showToggle,
  onToggleCompletion,
}) => {
  return (
    <div className="h-38 bg-cover bg-center relative"
    >
      {/* Category Badge */}
      <div className="absolute top-4 right-4 z-20">
        <div className="bg-orange-500 px-3 py-1 rounded-full border border-orange-600/50 shadow-lg">
          <span className="text-sm font-medium text-gray-900">
            {getMainCategory(kinds)}
          </span>
        </div>
      </div>

      {/* Completion Toggle - Top Left */}
      {showToggle && (
        <div className="absolute top-4 left-3 z-20">
          <ToggleButton
            isToggled={isCompleted}
            onToggle={onToggleCompletion}
            isLoading={isUpdating}
            label={isCompleted ? 'Mark as not completed' : 'Mark as completed'}
          />
        </div>
      )}

      {/* Gradient overlay that becomes more transparent on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent opacity-90 group-hover:opacity-75 transition-opacity duration-300 z-10" />
      
      {/* Site name with glow effect */}
      <div className="absolute -bottom-2 left-0 right-0 p-4 z-20">
        <h3 className="text-sm font-bold text-white drop-shadow-lg group-hover:text-orange-100 transition-colors duration-300">
          {name}
        </h3>
      </div>
    </div>
  );
}; 