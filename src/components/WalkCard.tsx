'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Walk } from '@/app/types/Walk';
import { toast } from 'react-hot-toast';
import { RatingPanel } from './WalkCard/RatingPanel';
import { CompletionModal } from './WalkCard/CompletionModal';
import { CommentsModal } from './WalkCard/CommentsModal';
import { CompletionCelebration } from './shared/CompletionCelebration';
import { ToggleButton } from './shared/ToggleButton';
import { WalkCardFooter } from './WalkCard/WalkCardFooter';

interface WalkCardProps {
  walk: Walk;
  isCompleted?: boolean;
  onToggleCompletion: (walkId: number, completed: boolean) => Promise<void>;
  isInitialLoading?: boolean;
  onSubmitRating: (walkId: number, rating: number, comment: string) => Promise<Walk>;
}

export const WalkCard: React.FC<WalkCardProps> = ({
  walk,
  isCompleted: initialIsCompleted = false,
  onToggleCompletion,
  isInitialLoading = false,
  onSubmitRating,
}) => {
  const { data: session } = useSession();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showRatingPanel, setShowRatingPanel] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number>();
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [hasComments, setHasComments] = useState(false);

  // Derived state
  const hasUserRated = !!walk.userRating;
  const userRating = walk.userRating;

  // Check if there are comments when component mounts
  useEffect(() => {
    const checkComments = async () => {
      try {
        const response = await fetch(`/api/walks/comments/count?walkId=${walk.id}`);
        if (!response.ok) throw new Error('Failed to check comments');
        const data = await response.json();
        setHasComments(data.count > 0);
      } catch (error) {
        console.error('Error checking comments:', error);
      }
    };

    checkComments();
  }, [walk.id]);

  const handleSubmitRating = async () => {
    if (!selectedRating) return;

    try {
      setIsSubmitting(true);
      
      const updatedWalk = await onSubmitRating(
        walk.id, 
        selectedRating, 
        comment
      );
      
      // Update all rating properties
      walk.userRating = selectedRating;
      walk.userComment = comment.trim() || undefined;
      walk.averageRating = updatedWalk.averageRating;
      walk.totalRatings = updatedWalk.totalRatings;
      
      // Set hasComments to true if a comment was provided
      if (comment.trim()) {
        setHasComments(true);
      }
      
      setShowRatingPanel(false);
      setShowCompletionModal(false);
      
      toast.success('Rating submitted successfully!');
    } catch (error) {
      console.error('[WalkCard] Error in handleSubmitRating:', error);
      toast.error('Failed to submit rating');
    } finally {
      setIsSubmitting(false);
      setIsUpdating(false);
    }
  };

  const handleToggle = async () => {
    if (!session?.user || isUpdating) return;
    
    try {
      setIsUpdating(true);
      await onToggleCompletion(walk.id, !initialIsCompleted);

      // Show celebration animation if marking as completed
      if (!initialIsCompleted) {
        setShowCelebration(true);
        
        // Show completion modal if hasn't rated yet
        if (!hasUserRated) {
          setShowCompletionModal(true);
        }
      }
    } catch (error) {
      console.error('[WalkCard] Error in handleToggle:', error);
      toast.error('Failed to update completion status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Format distance string
  const distanceString = `${walk.Distance_K} kms / ${walk.Distance_M} miles`;

  return (
    <>
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
        
        {/* Walk Card Header */}
        <div className="h-38 bg-cover bg-center relative">
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent opacity-90 group-hover:opacity-75 transition-opacity duration-300 z-10" />
          
          {/* Completion Toggle - Top Left */}
          {session?.user && (
            <div className="absolute top-4 left-3 z-20">
              <ToggleButton
                isToggled={initialIsCompleted}
                onToggle={handleToggle}
                isLoading={isUpdating}
                size="md"
                disabled={isUpdating}
                label={`Mark ${walk.name} as ${initialIsCompleted ? 'incomplete' : 'complete'}`}
              />
            </div>
          )}
          
          {/* Walk name */}
          <div className="absolute -bottom-2 left-0 right-0 p-4 z-20">
            <h3 className="text-xl font-bold text-white drop-shadow-lg group-hover:text-orange-100 transition-colors duration-300">
              {walk.name}
            </h3>
          </div>
        </div>

        {/* Content Section - Fixed height */}
        <div className="h-[240px] bg-gradient-to-b from-gray-800 to-gray-900">
          {showRatingPanel ? (
            <RatingPanel
              selectedRating={hasUserRated ? userRating : selectedRating}
              comment={hasUserRated ? (walk.userComment || '') : comment}
              isSubmitting={isSubmitting}
              readOnly={hasUserRated}
              onClose={() => setShowRatingPanel(false)}
              onRatingChange={setSelectedRating}
              onCommentChange={setComment}
              onSubmit={handleSubmitRating}
            />
          ) : (
            <div className="h-full p-4 flex flex-col">
              {/* Walk Details Content */}
              <div className="flex-1">
                <div className="space-y-2">
                  <p className="text-gray-300">
                    <span className="text-gray-500">Distance:</span> {distanceString}
                  </p>
                  <p className="text-gray-300">
                    <span className="text-gray-500">OS Maps:</span> {walk.namedOnOSMaps || 'Not specified'}
                  </p>
                  <p className="text-gray-300">
                    <span className="text-gray-500">Waymarked:</span> {walk.waymarked || 'Not specified'}
                  </p>
                  <a 
                    href={walk.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-400 hover:text-orange-300 text-sm"
                  >
                    View on LDWA
                  </a>
                </div>
              </div>

              <WalkCardFooter
                rating={walk.averageRating}
                totalRatings={walk.totalRatings}
                hasRecentComments={hasComments}
                isUserLoggedIn={!!session?.user}
                hasUserRated={hasUserRated}
                onShowComments={() => setShowComments(true)}
                onShowRatingPanel={() => setShowRatingPanel(true)}
              />
            </div>
          )}
        </div>

        {showCompletionModal && (
          <CompletionModal
            isOpen={showCompletionModal}
            walkName={walk.name}
            onConfirm={() => setShowCompletionModal(false)}
            onSkip={() => setShowCompletionModal(false)}
            onRateAndComment={() => {
              setShowCompletionModal(false);
              setShowRatingPanel(true);
            }}
          />
        )}

        {showComments && (
          <CommentsModal
            isOpen={showComments}
            onClose={() => setShowComments(false)}
            walkId={walk.id}
          />
        )}
      </div>

      {showCelebration && (
        <CompletionCelebration
          onComplete={() => setShowCelebration(false)}
        />
      )}
    </>
  );
}; 