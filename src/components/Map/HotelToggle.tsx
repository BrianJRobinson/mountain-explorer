import React from 'react';

interface HotelToggleProps {
  isVisible: boolean;
  onToggle: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  className?: string;
}

export const HotelToggle: React.FC<HotelToggleProps> = ({
  isVisible,
  onToggle,
  onRefresh,
  isLoading = false,
  className = ''
}) => {
  return (
    <div className={`hotel-toggle flex items-center gap-2 ${className}`}>
      <button
        onClick={onToggle}
        className={`flex items-center justify-center w-10 h-6 rounded-md transition-colors ${
          isVisible ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-300'
        }`}
        title={isVisible ? 'Hide Hotels' : 'Show Hotels'}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="currentColor" 
          className="w-4 h-4"
        >
          <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
          <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
        </svg>
      </button>
      
      {isVisible && onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className={`flex items-center justify-center w-6 h-6 rounded-md transition-colors ${
            isLoading 
              ? 'bg-purple-700 text-white cursor-not-allowed' 
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
          title="Refresh hotel data"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="currentColor" 
            className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}
          >
            <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-3.183a.75.75 0 100 1.5h4.992a.75.75 0 00.75-.75V4.356a.75.75 0 00-1.5 0v3.18l-1.9-1.9A9 9 0 003.306 9.67a.75.75 0 101.45.388zm15.408 3.352a.75.75 0 00-.919.53 7.5 7.5 0 01-12.548 3.364l-1.902-1.903h3.183a.75.75 0 000-1.5H2.984a.75.75 0 00-.75.75v4.992a.75.75 0 001.5 0v-3.18l1.9 1.9a9 9 0 0015.059-4.035.75.75 0 00-.53-.918z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );
};
