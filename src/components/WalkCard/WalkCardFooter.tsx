import React from 'react';
import { StarRating } from '../shared/StarRating';

interface WalkCardFooterProps {
  rating?: number;
  totalRatings?: number;
  hasRecentComments: boolean;
  isUserLoggedIn: boolean;
  hasUserRated: boolean;
  onShowComments: () => void;
  onShowRatingPanel: () => void;
}

export const WalkCardFooter: React.FC<WalkCardFooterProps> = ({
  rating,
  totalRatings,
  hasRecentComments,
  isUserLoggedIn,
  hasUserRated,
  onShowComments,
  onShowRatingPanel,
}) => {
  return (
    <div className="pt-2 border-t border-gray-700/50 flex items-center justify-between">
      <div className="flex items-center gap-0.5">
        {rating === undefined ? (
          <span className="text-sm text-gray-500">Not Rated</span>
        ) : (
          <>
            <StarRating
              rating={rating}
              size="sm"
            />
            <span className="text-sm text-gray-400 ml-1">
              ({totalRatings})
            </span>
          </>
        )}
      </div>
      {isUserLoggedIn ? (
        <div className="flex items-center gap-2">
          {hasRecentComments && (
            <button
              onClick={onShowComments}
              className="group/tooltip relative w-8 h-8 flex items-center justify-center rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-gray-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <div className="absolute bottom-full right-0 transform -translate-y-2 pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200">
                <div className="px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg whitespace-nowrap border border-gray-800">
                  View Comments
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900 border-r border-b border-gray-800"></div>
                </div>
              </div>
            </button>
          )}
          <button
            onClick={onShowRatingPanel}
            className={`group/tooltip relative w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
              hasUserRated
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-gray-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <div className="absolute bottom-full right-0 transform -translate-y-2 pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200">
              <div className="px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg whitespace-nowrap border border-gray-800">
                {hasUserRated ? "View your rating" : "Rate & Comment"}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900 border-r border-b border-gray-800"></div>
              </div>
            </div>
          </button>
        </div>
      ) : (
        <a href="/login" className="text-sm text-orange-400 hover:text-orange-300 transition-colors">
          Sign in
        </a>
      )}
    </div>
  );
}; 