'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Site } from '@/app/types/Sites';
import { toast } from 'react-hot-toast';
import { SitesCardHeader } from './SitesCard/SitesCardHeader';
import { SitesDetails } from './SitesCard/SitesDetails';
import { RatingPanel } from './SitesCard/RatingPanel';
import { SitesCardFooter } from './SitesCard/SitesCardFooter';
import { CompletionModal } from './SitesCard/CompletionModal';
import { CommentsModal } from './SitesCard/CommentsModal';
import { CompletionCelebration } from './shared/CompletionCelebration';
import { SitesMap } from './SitesCard/SitesMap';

interface SitesCardProps {
  site: Site;
  isCompleted?: boolean;
  onToggleCompletion: (siteId: number, completed: boolean) => Promise<void>;
  isInitialLoading?: boolean;
  allSites?: Site[];
  onMapMarkerClick?: (siteName: string) => void;
  onSubmitRating: (siteId: number, rating: number, comment: string) => Promise<Site>;
  hasComments: boolean;
  commentCount: number;
  onCommentAdded?: () => void;
}

export const SitesCard: React.FC<SitesCardProps> = ({
  site,
  isCompleted: initialIsCompleted = false,
  onToggleCompletion,
  isInitialLoading = false,
  allSites,
  onMapMarkerClick,
  onSubmitRating,
  hasComments,
  commentCount,
  onCommentAdded,
}) => {
  const { data: session } = useSession();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showRatingPanel, setShowRatingPanel] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number>();
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const hasUserRated = !!site.userRating;
  const userRating = site.userRating;

  const handleSubmitRating = async () => {
    if (!selectedRating) return;

    try {
      console.log(`[SitesCard-${site.id}] Starting rating submission:`, {
        selectedRating,
        comment,
        currentUserRating: site.userRating,
        currentAverageRating: site.averageRating,
        currentTotalRatings: site.totalRatings
      });
      setIsSubmitting(true);
      const updatedSite = await onSubmitRating(
        site.id, 
        selectedRating, 
        comment
      );
      console.log(`[SitesCard-${site.id}] Received updated site:`, updatedSite);
      site.userRating = selectedRating;
      site.userComment = comment.trim() || undefined;
      site.averageRating = updatedSite.averageRating;
      site.totalRatings = updatedSite.totalRatings;
      console.log(`[SitesCard-${site.id}] Updated site object:`, site);
      setShowRatingPanel(false);
      setShowCompletionModal(false);
      toast.success('Rating submitted successfully!');
    } catch (error) {
      console.error(`[SitesCard-${site.id}] Error in handleSubmitRating:`, error);
      toast.error('Failed to submit rating');
    } finally {
      setIsSubmitting(false);
      setIsUpdating(false);
    }
  };

  const handleToggle = async () => {
    if (!session?.user || isUpdating) return;
    
    try {
      console.log(`[SitesCard-${site.id}] Starting toggle completion:`, {
        currentlyCompleted: initialIsCompleted,
        willBeCompleted: !initialIsCompleted
      });
      setIsUpdating(true);
      await onToggleCompletion(site.id, !initialIsCompleted);
      console.log(`[SitesCard-${site.id}] Toggle completion successful`);
      if (!initialIsCompleted) {
        setShowCelebration(true);
        if (!hasUserRated) {
          setShowCompletionModal(true);
        }
      }
    } catch (error) {
      console.error(`[SitesCard-${site.id}] Error in handleToggle:`, error);
      toast.error('Failed to update completion status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleShowMap = () => {
    console.log(`[SitesCard-${site.id}] handleShowMap called`);
    setShowMap(true);
  };

  const handleCloseMap = () => {
    console.log(`[SitesCard-${site.id}] handleCloseMap called`);
    setShowMap(false);
  };

  const handleSiteSelectFromMap = (selectedSiteName: string) => {
    console.log(`[SitesCard-${site.id}] handleSiteSelectFromMap called with:`, selectedSiteName);
    if (onMapMarkerClick) {
      onMapMarkerClick(selectedSiteName);
    }
    setShowMap(false);
  };

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

        <SitesCardHeader
          name={site.name}
          kinds={site.kinds}
          isCompleted={initialIsCompleted}
          isUpdating={isUpdating}
          showToggle={!!session?.user}
          onToggleCompletion={handleToggle}
        />

        <div className="h-[240px] bg-gradient-to-b from-gray-800 to-gray-900">
          {showRatingPanel ? (
            <RatingPanel
              selectedRating={hasUserRated ? userRating : selectedRating}
              comment={hasUserRated ? (site.userComment || '') : comment}
              isSubmitting={isSubmitting}
              readOnly={hasUserRated}
              onClose={() => setShowRatingPanel(false)}
              onRatingChange={setSelectedRating}
              onCommentChange={setComment}
              onSubmit={handleSubmitRating}
            />
          ) : (
            <div className="h-full p-4 flex flex-col">
              <div className="flex-1">
                <SitesDetails
                  kinds={site.kinds}
                  latitude={site.latitude}
                  longitude={site.longitude}
                  onShowMap={handleShowMap}
                />
              </div>

              <SitesCardFooter
                rating={site.averageRating}
                totalRatings={site.totalRatings}
                hasRecentComments={hasComments}
                commentCount={commentCount}
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
            siteName={site.name}
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
            siteId={site.id}
            onCommentAdded={onCommentAdded}
          />
        )}

        {showCelebration && (
          <CompletionCelebration onComplete={() => setShowCelebration(false)} />
        )}
      </div>

      <SitesMap 
        isOpen={showMap}
        site={site}
        allSites={allSites || []}
        onSiteSelect={handleSiteSelectFromMap}
        onClose={handleCloseMap}
      />
    </>
  );
}; 