'use client';

import React, { useState } from 'react';

interface StarRatingProps {
  rating?: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  editable?: boolean;
  disabled?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  editable = false,
  disabled = false,
  onChange,
  className = '',
}) => {
  const [hoverRating, setHoverRating] = useState<number | undefined>();

  // Size classes for the star icons
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const handleStarHover = (star: number, event: React.MouseEvent) => {
    if (!interactive || disabled) return;
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const halfStar = x < rect.width / 2;
    setHoverRating(halfStar ? star - 0.5 : star);
  };

  const handleStarClick = (star: number, event: React.MouseEvent) => {
    if (!interactive || disabled) return;
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const halfStar = x < rect.width / 2;
    onChange?.(halfStar ? star - 0.5 : star);
  };

  const displayRating = hoverRating !== undefined ? hoverRating : rating;

  const displayStaticStars = () => 
  {
     return (
      <div className={`star-rating-wrapper flex items-center gap-0.5 ${className}`}>
      {Array.from({ length: maxRating }, (_, i) => i + 1).map((star) => {
        const isStarFilled = displayRating !== undefined && star <= Math.floor(displayRating);
        const isHalfStar = displayRating !== undefined && 
          Math.ceil(displayRating) === star && 
          !Number.isInteger(displayRating);
        const shouldAnimate = displayRating !== undefined && star <= Math.ceil(displayRating);
        
        return (
          <div 
            key={star} 
            className={`relative ${!shouldAnimate ? 'no-animate' : ''}`}
          >
            {/* Base star */}
            <svg 
              className={`${sizeClasses[size]} transition-transform ${
                isStarFilled ? 'text-orange-400' : 'text-gray-600'
              }`}
              viewBox="0 0 20 20"
              fill="currentColor"
              onClick={(e) => handleStarClick(star, e)}
              onMouseMove={(e) => handleStarHover(star, e)}
              onMouseLeave={() => interactive && setHoverRating(undefined)}
              style={{ willChange: 'transform, color' }}
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>

            {/* Half star overlay */}
            {isHalfStar && (
              <div className="absolute inset-0 overflow-hidden w-[50%]">
                <svg 
                  className={`${sizeClasses[size]} text-orange-400`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  style={{ willChange: 'transform, color' }}
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
     ) 
  }


  const displayEditableStars = () => 
  {
    return (
      <div className={`flex items-center gap-0.5 ${className}`}>
        {Array.from({ length: maxRating }, (_, i) => i + 1).map((star) => (
          <button
            key={star}
            className={`relative ${interactive && !disabled ? 'cursor-pointer' : 'cursor-default'}`}
            onClick={(e) => handleStarClick(star, e)}
            onMouseMove={(e) => handleStarHover(star, e)}
            onMouseLeave={() => setHoverRating(undefined)}
            disabled={disabled || !interactive}
            type="button"
          >
            <svg 
              className={`${sizeClasses[size]} ${
                (displayRating !== undefined && star <= Math.floor(displayRating)) 
                  ? 'text-orange-400' 
                  : 'text-gray-600'
              } transition-colors duration-200`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            
            {/* Half star overlay */}
            {displayRating !== undefined && 
             Math.ceil(displayRating) === star && 
             !Number.isInteger(displayRating) && (
              <svg 
                className={`absolute inset-0 ${sizeClasses[size]} text-orange-400`}
                viewBox="0 0 20 20"
                style={{ 
                  fill: 'currentColor',
                  clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)'
                }}
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    editable ? displayEditableStars() : displayStaticStars()
  );
}; 