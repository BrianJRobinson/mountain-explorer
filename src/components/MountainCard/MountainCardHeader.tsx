import React from 'react';
import { ToggleButton } from '../shared/ToggleButton';

interface MountainCardHeaderProps {
  name: string;
  categoryId: number;
  isCompleted: boolean;
  isUpdating: boolean;
  showToggle: boolean;
  onToggleCompletion: () => void;
}

const getCategoryName = (categoryId: number) => {
  return categoryId === 12 ? 'Munro' : 'Corbett';
};

const getCategoryImage = (categoryId: number) => {
  switch (categoryId) {
    case 11:
      return '/mountain-category-11.jpg';
    case 12:
      return '/mountain-category-12.jpg';
    default:
      return '/mountain-default.jpg';
  }
};

export const MountainCardHeader: React.FC<MountainCardHeaderProps> = ({
  name,
  categoryId,
  isCompleted,
  isUpdating,
  showToggle,
  onToggleCompletion,
}) => {
  return (
    <div className={`
      h-38 bg-cover bg-center relative
      ${isCompleted ? 'animate-completion' : ''}
    `}
      style={{
        backgroundImage: `url(${getCategoryImage(categoryId)})`
      }}
    >
      {/* Category Badge */}
      <div className="absolute top-4 right-4 z-20">
        <div className="bg-orange-500 px-3 py-1 rounded-full border border-orange-600/50 shadow-lg">
          <span className="text-sm font-medium text-gray-900">
            {getCategoryName(categoryId)}
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
      
      {/* Mountain name with glow effect */}
      <div className="absolute -bottom-2 left-0 right-0 p-4 z-20">
        <h3 className="text-xl font-bold text-white drop-shadow-lg group-hover:text-orange-100 transition-colors duration-300">
          {name}
        </h3>
      </div>

      {/* Completion celebration overlay */}
      {isCompleted && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-orange-500/20 to-transparent animate-fade-out" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-orange-500/30 animate-pulse-slow" />
          </div>
        </div>
      )}
    </div>
  );
}; 