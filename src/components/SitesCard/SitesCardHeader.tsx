import React, { useState } from 'react';
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

export const SitesCardHeader: React.FC<SitesCardHeaderProps> = ({
  name,
  kinds,
  isCompleted,
  isUpdating,
  showToggle,
  onToggleCompletion,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

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
      
      {/* Site name container (relative positioning context for tooltip) */}
      <div className="absolute -bottom-2 left-0 right-0 p-4 z-20">
        {/* Site name with line clamping and custom tooltip trigger */}
        <h3 
          className="text-sm font-bold text-white drop-shadow-lg group-hover:text-orange-100 transition-colors duration-300 line-clamp-2 relative cursor-default"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {name}
        </h3>
         {/* Custom Tooltip */}
         {showTooltip && (
          <div className="absolute bottom-full left-0 mb-2 max-w-xs bg-gray-900 text-white text-xs rounded-lg py-1 px-3 z-50 border border-orange-500/30 shadow-lg pointer-events-none" 
               style={{ whiteSpace: 'normal' }}
          >
            {name}
          </div>
        )}
      </div>
    </div>
  );
}; 