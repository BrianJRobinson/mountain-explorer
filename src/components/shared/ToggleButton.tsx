'use client';

import React from 'react';

interface ToggleButtonProps {
  isToggled: boolean;
  onToggle: () => void;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  label?: string;
  className?: string;
}

export const ToggleButton: React.FC<ToggleButtonProps> = ({
  isToggled,
  onToggle,
  isLoading = false,
  size = 'md',
  disabled = false,
  label,
  className = '',
}) => {
  // Size configurations
  const sizeClasses = {
    sm: {
      button: 'w-10 h-5',
      circle: 'w-3.5 h-3.5',
      translate: 'translate-x-5',
    },
    md: {
      button: 'w-14 h-7',
      circle: 'w-5 h-5',
      translate: 'translate-x-7',
    },
    lg: {
      button: 'w-16 h-8',
      circle: 'w-6 h-6',
      translate: 'translate-x-8',
    },
  };

  return (
    <div
      onClick={() => !disabled && !isLoading && onToggle()}
      role="button"
      tabIndex={0}
      aria-pressed={isToggled}
      className={`
        relative inline-flex items-center cursor-pointer
        ${disabled || isLoading ? 'opacity-75 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      <div className={`
        ${sizeClasses[size].button} rounded-full 
        transition-colors duration-200 ease-in-out
        ${isToggled ? 'bg-orange-500' : 'bg-gray-700'}
        relative
        ${isLoading ? 'animate-pulse' : ''}
      `}>
        <div className={`
          absolute top-1 left-1
          ${sizeClasses[size].circle} rounded-full
          transition-all duration-200 ease-in-out
          ${isToggled ? `${sizeClasses[size].translate} bg-white` : 'translate-x-0 bg-gray-400'}
          shadow-lg
        `}>
          {isLoading && (
            <svg
              className="absolute inset-0 w-full h-full animate-spin text-orange-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
        </div>
      </div>
      {label && (
        <span className="sr-only">
          {label}
        </span>
      )}
    </div>
  );
}; 