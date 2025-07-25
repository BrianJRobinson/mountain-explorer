import React from 'react';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  displayRating?: number;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const StarRating: React.FC<StarRatingProps> = ({ rating, maxStars = 5, displayRating, interactive, size = 'md' }) => {
  if (rating <= 0) {
    return null; // Don't render anything if rating is 0 or less
  }

  const filledStars = Math.round(rating);
  const sizeClasses: { [key: string]: string } = {
    sm: 'text-sm',
    md: 'text-md',
    lg: 'text-lg',
  };

  return (
    <div className="flex items-center">
      {[...Array(maxStars)].map((_, index) => {
        const starNumber = index + 1;
        return (
          <svg
            key={starNumber}
            className={`w-5 h-5 ${starNumber <= filledStars ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        );
      })}
      {/* Display the numeric rating if it's provided and greater than 0 */}
      {displayRating && displayRating > 0 && (
        <span className={`ml-2 font-bold text-gray-400 ${sizeClasses[size]}`}>
          {displayRating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;
