'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Mountain } from '@/app/types/Mountain';
import { toast } from 'react-hot-toast';

interface MountainCardProps {
  mountain: Mountain;
  isCompleted?: boolean;
  onToggleCompletion: (mountainId: number, completed: boolean) => Promise<void>;
  isInitialLoading?: boolean;
}

export const MountainCard: React.FC<MountainCardProps> = ({
  mountain,
  isCompleted = false,
  onToggleCompletion,
  isInitialLoading = false,
}) => {
  const { data: session } = useSession();
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentState, setCurrentState] = useState(isCompleted);
  const [showRatingPanel, setShowRatingPanel] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number | undefined>(undefined);
  const [hoverRating, setHoverRating] = useState<number | undefined>(undefined);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [mountainData, setMountainData] = useState(mountain);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const ignoreNextPropChange = useRef(false);
  const categoryName = mountainData.MountainCategoryID === 12 ? 'Munro' : 'Corbett';
  const rating = mountainData.averageRating;
  const hasUserRated = mountainData.userRating !== undefined;
  const userRating = mountainData.userRating;
  const recentComments = mountainData.recentComments || [];

  // Update mountainData when mountain prop changes
  useEffect(() => {
    setMountainData(mountain);
  }, [mountain]);

  const handleStarClick = (starIndex: number, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const halfStar = x < rect.width / 2;
    const value = halfStar ? starIndex - 0.5 : starIndex;
    setSelectedRating(value);
  };

  const handleStarHover = (star: number, event: React.MouseEvent) => {
    if (!hasUserRated) {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      const percentage = (event.clientX - rect.left) / rect.width;
      const rating = star - 0.5 + percentage;
      setHoverRating(Math.max(0.5, Math.min(star, rating)));
    }
  };

  // Only update from props if we didn't trigger the change ourselves
  useEffect(() => {
    if (ignoreNextPropChange.current) {
      ignoreNextPropChange.current = false;
      return;
    }
    setCurrentState(isCompleted);
  }, [isCompleted]);

  const handleToggle = async () => {
    if (!session?.user || isUpdating) return;

    const newState = !currentState;
    
    if (newState) {
      // If marking as completed and user hasn't rated yet, show the confirmation modal
      if (!hasUserRated) {
        setShowCompletionModal(true);
      } else {
        // If user has already rated, just mark as completed without showing modal
        await processToggle(newState);
      }
      return;
    } else {
      // If marking as not completed, proceed directly
      await processToggle(newState);
    }
  };

  const processToggle = async (newState: boolean) => {
    // Set flag to ignore the next prop change since we're triggering it
    ignoreNextPropChange.current = true;
    
    // Update visual state immediately
    setCurrentState(newState);
    setIsUpdating(true);

    try {
      // Call the API
      await onToggleCompletion(mountainData.id, newState);
      // Keep our flag true since the API succeeded
      ignoreNextPropChange.current = true;
      
      // If marking as completed, show the rating panel
      if (newState) {
        setShowRatingPanel(true);
      }
    } catch {
      // If the API call fails, revert the visual state
      setCurrentState(!newState);
      // Reset our flag since we want to sync with the server state
      ignoreNextPropChange.current = false;
    } finally {
      setIsUpdating(false);
    }
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

  const handleSubmitRating = async () => {
    if (!selectedRating || !session?.user?.id) {
      toast.error('Please select a rating before submitting');
      return;
    }
    
    try {
      setIsSubmitting(true);
      const response = await fetch('/api/mountains/rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mountainId: mountainData.id,
          rating: selectedRating,
          comment: comment.trim() || null
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit rating');
      }

      // Create a new mountain data object with updated values
      const updatedMountain = { ...mountainData };
      updatedMountain.userRating = selectedRating;
      updatedMountain.userComment = comment.trim() || undefined;
      
      if (comment.trim()) {
        updatedMountain.recentComments = [{
          rating: selectedRating,
          comment: comment.trim() || null,
          createdAt: new Date().toISOString(),
          userName: session.user.name || null
        }, ...(mountainData.recentComments || []).slice(0, 4)];
      }

      // Recalculate average rating
      const newTotalRatings = (mountainData.totalRatings || 0) + (mountainData.userRating === undefined ? 1 : 0);
      const oldRatingSum = (mountainData.averageRating || 0) * (mountainData.totalRatings || 0);
      const newRatingSum = oldRatingSum + (mountainData.userRating === undefined ? selectedRating : (selectedRating - (mountainData.userRating || 0)));
      updatedMountain.averageRating = newRatingSum / newTotalRatings;
      updatedMountain.totalRatings = newTotalRatings;

      // Update the state with the new mountain data
      setMountainData(updatedMountain);

      // If not already completed, mark as completed
      if (!currentState) {
        await processToggle(true);
      }

      toast.success('Rating submitted successfully!');
      setShowRatingPanel(false);
      // Reset form
      setSelectedRating(undefined);
      setComment('');
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setShowRatingPanel(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`
      group relative bg-gray-800 rounded-xl overflow-hidden h-full
      border border-orange-500/20 hover:border-orange-500/40
      shadow-[0_0_15px_-3px_rgba(249,115,22,0.1)] hover:shadow-[0_0_25px_-5px_rgba(249,115,22,0.2)]
      ${isInitialLoading ? 'animate-pulse blur-[2px]' : ''}
    `}>
      {isInitialLoading && (
        <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <svg
            className="w-8 h-8 animate-spin text-orange-500"
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
        </div>
      )}
      
      {/* Category Badge */}
      <div className="absolute top-4 right-4 z-20">
        <div className="bg-orange-500 px-3 py-1 rounded-full border border-orange-600/50 shadow-lg">
          <span className="text-sm font-medium text-gray-900">
            {categoryName}
          </span>
        </div>
      </div>

      {/* Completion Toggle - Top Left */}
      {session?.user && (
        <div className="absolute top-4 left-3 z-20">
          <div
            onClick={handleToggle}
            role="button"
            tabIndex={0}
            aria-pressed={currentState}
            className={`
              relative inline-flex items-center cursor-pointer group
              ${isUpdating ? 'opacity-75' : ''}
            `}
          >
            <div className={`
              w-14 h-7 rounded-full 
              transition-colors duration-200 ease-in-out
              ${currentState ? 'bg-orange-500' : 'bg-gray-700'}
              relative
              ${isUpdating ? 'animate-pulse' : ''}
            `}>
              <div className={`
                absolute top-1 left-1
                w-5 h-5 rounded-full
                transition-all duration-200 ease-in-out
                ${currentState ? 'translate-x-7 bg-white' : 'translate-x-0 bg-gray-400'}
                shadow-lg
              `}>
                {isUpdating && (
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
            <span className="sr-only">
              {currentState ? 'Mark as not completed' : 'Mark as completed'}
            </span>
          </div>
        </div>
      )}

      <div className="h-38 bg-cover bg-center relative"
        style={{
          backgroundImage: `url(${getCategoryImage(mountainData.MountainCategoryID)})`
        }}
      >
        {/* Gradient overlay that becomes more transparent on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent opacity-90 group-hover:opacity-75 transition-opacity duration-300 z-10" />
        
        {/* Mountain name with glow effect */}
        <div className="absolute -bottom-2 left-0 right-0 p-4 z-20">
          <h3 className="text-xl font-bold text-white drop-shadow-lg group-hover:text-orange-100 transition-colors duration-300">
            {mountainData.ukHillsDbName}
          </h3>
        </div>
      </div>

      {/* Content Section - Fixed height */}
      <div className="h-[240px] bg-gradient-to-b from-gray-800 to-gray-900">
        {showRatingPanel ? (
          <div className="h-full p-4 flex flex-col">
            {/* Rating Panel Content */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-medium text-white">
                {hasUserRated ? "Your Rating" : "Rate & Comment"}
              </h3>
              <button
                onClick={() => setShowRatingPanel(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex items-center justify-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className={`relative ${hasUserRated ? 'cursor-default' : ''}`}
                  onClick={(e) => !hasUserRated && handleStarClick(star, e)}
                  onMouseMove={(e) => !hasUserRated && handleStarHover(star, e)}
                  onMouseLeave={() => !hasUserRated && setHoverRating(undefined)}
                  disabled={hasUserRated}
                >
                  <svg 
                    className={`w-8 h-8 ${
                      hasUserRated 
                        ? (star <= (userRating || 0) ? 'text-orange-400' : 'text-gray-600')
                        : ((hoverRating !== undefined && star <= hoverRating) || 
                           (hoverRating === undefined && selectedRating !== undefined && star <= selectedRating)
                            ? 'text-orange-400'
                            : 'text-gray-600')
                    } transition-colors duration-200`}
                    viewBox="0 0 20 20"
                    style={{ fill: 'currentColor' }}
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {/* Show half star if needed */}
                  {(hasUserRated 
                    ? (Math.ceil(userRating || 0) === star && !Number.isInteger(userRating || 0))
                    : ((hoverRating !== undefined && Math.ceil(hoverRating) === star && !Number.isInteger(hoverRating)) ||
                       (hoverRating === undefined && selectedRating !== undefined && 
                        Math.ceil(selectedRating) === star && !Number.isInteger(selectedRating)))) && (
                    <svg 
                      className="absolute inset-0 w-8 h-8 text-orange-400"
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
            
            <textarea
              placeholder={hasUserRated ? "Your previous comment" : "Add a comment..."}
              value={hasUserRated ? (mountainData.userComment || '') : comment}
              onChange={(e) => !hasUserRated && setComment(e.target.value)}
              disabled={hasUserRated}
              className={`flex-1 w-full px-3 py-1.5 bg-gray-700 text-sm text-white rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                hasUserRated ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            />
            
            {!hasUserRated && (
              <button 
                onClick={handleSubmitRating}
                disabled={!selectedRating || isSubmitting}
                className={`w-full py-1.5 mt-2 text-sm rounded-lg transition-colors ${
                  !selectedRating || isSubmitting
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-orange-500 text-white hover:bg-orange-600'
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            )}
          </div>
        ) : (
          <div className="h-full p-4 flex flex-col">
            {/* Mountain Details Content */}
            <div className="space-y-3 flex-1">
              {/* Height */}
              <div className="flex items-center text-gray-300 group-hover:text-gray-200">
                <svg className="w-5 h-10 mr-2 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="font-medium text-lg group-hover:text-gray-100">
                  {mountainData.Height}m
                </span>
              </div>

              {/* Location */}
              <div className="flex items-center text-gray-400 group-hover:text-gray-300">
                <svg className="w-5 h-10 mr-2 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm group-hover:text-gray-200 transition-colors duration-300">
                  {mountainData.ukHillsDbLatitude}, {mountainData.ukHillsDbLongitude}
                </span>
              </div>

              {/* Region */}
              <div className="flex items-center text-gray-400 group-hover:text-gray-300">
                <svg className="w-5 h-10 mr-2 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm group-hover:text-gray-200 transition-colors duration-300">
                  Region {mountainData.ukHillsDbSection}
                </span>
              </div>
            </div>

            {/* Rating Stars and Comment Button */}
            <div className="pt-2 border-t border-gray-700/50 flex items-center justify-between">
              <div className="flex items-center gap-0.5">
                {rating === undefined ? (
                  <span className="text-sm text-gray-500">Not Rated</span>
                ) : (
                  <>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-4 h-4 relative ${star <= Math.floor(rating) ? 'text-orange-400' : 'text-gray-600'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          {/* Show half star if needed */}
                          {(Math.ceil(rating) === star && !Number.isInteger(rating)) && (
                            <svg 
                              className="absolute inset-0 w-4 h-4 text-orange-400"
                              viewBox="0 0 20 20"
                              style={{ 
                                fill: 'currentColor',
                                clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)'
                              }}
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          )}
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm text-gray-400 ml-1">
                      ({mountainData.totalRatings})
                    </span>
                  </>
                )}
              </div>
              {session?.user && (
                <div className="flex items-center gap-2">
                  {recentComments.length > 0 && (
                    <button
                      onClick={() => setShowComments(true)}
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
                    ref={buttonRef}
                    onClick={() => setShowRatingPanel(true)}
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
              )}
              {!session?.user && (
                <a href="/login" className="text-sm text-orange-400 hover:text-orange-300 transition-colors">
                  Sign in
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Completion Confirmation Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="bg-gray-800 rounded-xl shadow-xl border border-orange-500/20 w-full max-w-md mx-4">
            <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">Congratulations</h3>
              <button
                onClick={() => {
                  setShowCompletionModal(false);
                  processToggle(true);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <p className="text-gray-300 mb-4">
                Congratulations on your climb up {mountainData.ukHillsDbName}! Would you like to rate and comment on your experience?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowCompletionModal(false);
                    processToggle(true);
                  }}
                  className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={() => {
                    setShowCompletionModal(false);
                    processToggle(true);
                    setShowRatingPanel(true);
                  }}
                  className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Rate & Comment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {showComments && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-xl shadow-xl border border-orange-500/20 w-full max-w-lg mx-4">
            <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">Recent Comments</h3>
              <button
                onClick={() => setShowComments(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
              {recentComments.map((comment, index) => (
                <div key={index} className="text-sm">
                  <div className="mb-2">
                    <span className="text-orange-400 font-medium">{comment.userName || 'Anonymous'}</span>
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-4 h-4 ${star <= comment.rating ? 'text-orange-400' : 'text-gray-600'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-300">{comment.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 