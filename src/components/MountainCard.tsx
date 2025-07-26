'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Mountain } from '@/app/types/Mountain';
import { toast } from 'react-hot-toast';
import type { Map as LeafletMap } from 'leaflet';
import { MountainCardHeader } from './MountainCard/MountainCardHeader';
import { MountainDetails } from './MountainCard/MountainDetails';
import { RatingPanel } from './MountainCard/RatingPanel';
import { MountainCardFooter } from './MountainCard/MountainCardFooter';
import { MountainMap } from './MountainCard/MountainMap';
import { CompletionModal } from './MountainCard/CompletionModal';
import { CommentsModal } from './MountainCard/CommentsModal';
import { CompletionCelebration } from './shared/CompletionCelebration';
import { loadMapLibraries } from '@/lib/mapLibraries';
import { loadMapState, updateMapState } from '@/lib/mapStateContext';

interface MountainCardProps {
  mountain: Mountain;
  isCompleted?: boolean;
  onToggleCompletion: (mountainId: number, completed: boolean) => Promise<void>;
  isInitialLoading?: boolean;
  allMountains: Mountain[];
  onMapMarkerClick?: (mountainName: string) => void;
  onSubmitRating: (mountainId: number, rating: number, comment: string) => Promise<Mountain>;
}

// Dynamic imports for mapping libraries
// @ts-expect-error - These libraries do work at runtime despite the type error
let L: typeof import('leaflet')['default'] | undefined;

// Load libraries on mount
if (typeof window !== 'undefined') {
  loadMapLibraries().then(({ leaflet }) => {
    L = leaflet;
  });
}

export const MountainCard: React.FC<MountainCardProps> = ({
  mountain,
  isCompleted: initialIsCompleted = false,
  onToggleCompletion,
  isInitialLoading = false,
  allMountains,
  onMapMarkerClick,
  onSubmitRating,
}) => {
  const { data: session } = useSession();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showRatingPanel, setShowRatingPanel] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number>();
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Initialize map state with persistence
  const [showMap, setShowMap] = useState(() => {
    const mapState = loadMapState();
    // Only show map if this mountain was the active one
    return mapState.activeMountainId === mountain.id;
  });
  const [hotelsVisible, setHotelsVisible] = useState(() => {
    const mapState = loadMapState();
    return mapState.hotelsVisible;
  });
  const [showComments, setShowComments] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [hasComments, setHasComments] = useState(false);

  // Derived state
  const hasUserRated = !!mountain.userRating;
  const userRating = mountain.userRating;
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);

  // Check if there are comments when component mounts
  useEffect(() => {
    const checkComments = async () => {
      try {
        const response = await fetch(`/api/mountains/comments?mountainId=${mountain.id}`);
        if (!response.ok) throw new Error('Failed to check comments');
        const comments = await response.json();
        setHasComments(comments.length > 0);
      } catch (error) {
        console.error('Error checking comments:', error);
      }
    };

    checkComments();
  }, [mountain.id]);

  // Add tab visibility debugging
  useEffect(() => {
    const handleVisibilityChange = () => {
      console.log('🗻 [POPUP DEBUG] Tab visibility changed:', {
        hidden: document.hidden,
        visibilityState: document.visibilityState,
        timestamp: new Date().toISOString()
      });
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);


  // Initialize map when modal opens
  useEffect(() => {
    if (!showMap) return;

    // Fix scrolling when modal is open
    document.body.style.overflow = 'hidden';
    
  if (L && mapContainer.current) {

      // Clean up existing 2D map if it exists
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      
      const lat = parseFloat(mountain.ukHillsDbLatitude);
      const lng = parseFloat(mountain.ukHillsDbLongitude);

      // Initialize map centered on the current mountain with closer zoom
      map.current = L.map(mapContainer.current, {
        scrollWheelZoom: true,
        zoomControl: true,
      }).setView([lat, lng], 13);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map.current);

      // Add custom zoom control
      const zoomAllButton = L.Control.extend({
        options: {
          position: 'topleft'
        },

        onAdd: function(map: LeafletMap) {
          const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
          const button = L.DomUtil.create('a', '', container);
          button.innerHTML = `
            <div class="w-[30px] h-[30px] bg-white flex items-center justify-center cursor-pointer hover:bg-gray-100" title="View All Nearby">
              <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm14 0H3v12h14V3z" clip-rule="evenodd"/>
                <path fill-rule="evenodd" d="M13 7a1 1 0 10-2 0v1H9a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd"/>
              </svg>
            </div>
          `;
          
          L.DomEvent.on(button, 'click', function(e: Event) {
            L.DomEvent.stopPropagation(e);
            // Create bounds object to fit all markers
            const bounds = L.latLngBounds([]);
            allMountains.forEach(m => {
              bounds.extend([
                parseFloat(m.ukHillsDbLatitude),
                parseFloat(m.ukHillsDbLongitude)
              ]);
            });
            // Fit the map to show all markers with some padding
            map.fitBounds(bounds, {
              padding: [50, 50],
              maxZoom: 10
            });
          });

          return container;
        }
      });

      // Create markers for all mountains
      const markers = new Map<number, L.Marker>();
      
      allMountains.forEach((m) => {
        const mLat = parseFloat(m.ukHillsDbLatitude);
        const mLng = parseFloat(m.ukHillsDbLongitude);
        
        if (map.current) {
          const marker = L.marker([mLat, mLng])
            .addTo(map.current)
            .bindPopup(
              `<div class="text-center">
                <strong>${m.ukHillsDbName}</strong><br/>
                ${m.Height}m - ${m.MountainCategoryID === 12 ? 'Munro' : 'Corbett'}<br/>
                <button 
                  onclick="window.dispatchEvent(new CustomEvent('mountain-selected', { detail: '${m.ukHillsDbName}' }))"
                  class="px-2 py-1 mt-2 bg-orange-500 text-white rounded-md text-sm cursor-pointer hover:bg-orange-600"
                >
                  Show Details
                </button>
              </div>`,
              {
                className: 'mountain-popup'
              }
            );

          // Highlight the current mountain's marker
          if (m.id === mountain.id) {
            marker.setZIndexOffset(1000); // Bring to front
            marker.openPopup();
          }

          markers.set(m.id, marker);
        }
      });

      // Add the zoom control to the map
      if (map.current) {
        map.current.addControl(new zoomAllButton());

        // Force a resize after a short delay to ensure the container is visible
        setTimeout(() => {
          if (map.current) {
            map.current.invalidateSize();
          }
        }, 100);
      }

      // Add event listener for mountain selection
      const handleMountainSelected = (event: CustomEvent) => {
        if (onMapMarkerClick) {
          onMapMarkerClick(event.detail);
          setShowMap(false);
        }
      };

      window.addEventListener('mountain-selected', handleMountainSelected as EventListener);

      return () => {
        window.removeEventListener('mountain-selected', handleMountainSelected as EventListener);
      };
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      // Restore scrolling when modal is closed
      document.body.style.overflow = 'unset';
      // Remove any added styles
      const style = document.querySelector('style[data-mountain-marker]');
      if (style) {
        style.remove();
      }
    };
  }, [showMap, mountain.ukHillsDbLatitude, mountain.ukHillsDbLongitude, mountain.ukHillsDbName, mountain.id, allMountains, onMapMarkerClick]);

  const handleSubmitRating = async () => {
    if (!selectedRating) return;

    try {
      console.log('[MountainCard] Starting rating submission:', {
        mountainId: mountain.id,
        selectedRating,
        comment,
        currentUserRating: mountain.userRating,
        currentAverageRating: mountain.averageRating,
        currentTotalRatings: mountain.totalRatings
      });

      setIsSubmitting(true);
      
      const updatedMountain = await onSubmitRating(
        mountain.id, 
        selectedRating, 
        comment
      );

      console.log('[MountainCard] Received updated mountain:', {
        updatedMountain,
        willSetUserRating: selectedRating,
        willSetUserComment: comment.trim() || undefined,
        willSetAverageRating: updatedMountain.averageRating,
        willSetTotalRatings: updatedMountain.totalRatings
      });
      
      // Update all rating properties
      mountain.userRating = selectedRating;
      mountain.userComment = comment.trim() || undefined;
      mountain.averageRating = updatedMountain.averageRating;
      mountain.totalRatings = updatedMountain.totalRatings;

      console.log('[MountainCard] Updated mountain object:', {
        newUserRating: mountain.userRating,
        newUserComment: mountain.userComment,
        newAverageRating: mountain.averageRating,
        newTotalRatings: mountain.totalRatings
      });
      
      // Set hasComments to true since we just added a comment
      setHasComments(true);
      
      setShowRatingPanel(false);
      setShowCompletionModal(false);
      
      toast.success('Rating submitted successfully!');
    } catch (error) {
      console.error('[MountainCard] Error in handleSubmitRating:', error);
      toast.error('Failed to submit rating');
    } finally {
      setIsSubmitting(false);
      setIsUpdating(false);
    }
  };

  const handleToggle = async () => {
    if (!session?.user || isUpdating) return;
    
    try {
      console.log('[MountainCard] Starting toggle completion:', {
        mountainId: mountain.id,
        currentlyCompleted: initialIsCompleted,
        willBeCompleted: !initialIsCompleted
      });

      setIsUpdating(true);
      await onToggleCompletion(mountain.id, !initialIsCompleted);
      
      console.log('[MountainCard] Toggle completion successful:', {
        mountainId: mountain.id,
        newCompletedState: !initialIsCompleted
      });

      // Show celebration animation if marking as completed
      if (!initialIsCompleted) {
        setShowCelebration(true);
        
        // Show completion modal if hasn't rated yet
        if (!hasUserRated) {
          setShowCompletionModal(true);
        }
      }
    } catch (error) {
      console.error('[MountainCard] Error in handleToggle:', error);
      toast.error('Failed to update completion status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
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
        
        <MountainCardHeader
          name={mountain.ukHillsDbName}
          categoryId={mountain.MountainCategoryID}
          isCompleted={initialIsCompleted}
          isUpdating={isUpdating}
          showToggle={!!session?.user}
          onToggleCompletion={handleToggle}
        />

        {/* Debug Mountain ID - Only shown in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute top-0 right-0 bg-orange-500/20 text-orange-500 text-xs px-2 py-1 rounded-bl-lg">
            ID: {mountain.id}
          </div>
        )}

        {/* Content Section - Fixed height */}
        <div className="h-[240px] bg-gradient-to-b from-gray-800 to-gray-900">
          {showRatingPanel ? (
            <RatingPanel
              selectedRating={hasUserRated ? userRating : selectedRating}
              comment={hasUserRated ? (mountain.userComment || '') : comment}
              isSubmitting={isSubmitting}
              readOnly={hasUserRated}
              onClose={() => setShowRatingPanel(false)}
              onRatingChange={setSelectedRating}
              onCommentChange={setComment}
              onSubmit={handleSubmitRating}
            />
          ) : (
            <div className="h-full p-4 flex flex-col">
              {/* Mountain Details Content */}
              <MountainDetails
                height={mountain.Height}
                latitude={mountain.ukHillsDbLatitude}
                longitude={mountain.ukHillsDbLongitude}
                region={mountain.ukHillsDbSection}
                onShowMap={() => {
                  setShowMap(true);
                  updateMapState({ 
                    activeMountainId: mountain.id,
                    hotelsVisible: hotelsVisible
                  });
                }}
              />

              {/* Rating Stars and Comment Button */}
              <MountainCardFooter
                rating={mountain.averageRating}
                totalRatings={mountain.totalRatings}
                hasRecentComments={hasComments}
                isUserLoggedIn={!!session?.user}
                hasUserRated={hasUserRated}
                onShowComments={() => setShowComments(true)}
                onShowRatingPanel={() => setShowRatingPanel(true)}
              />
            </div>
          )}
        </div>

        {showMap && (
          <MountainMap
            isOpen={showMap}
            onClose={() => {
              setShowMap(false);
              updateMapState({ activeMountainId: undefined });
            }}
            mountain={mountain}
            allMountains={allMountains}
            onMountainSelect={onMapMarkerClick}
            hotelsVisible={hotelsVisible}
            onToggleHotels={(visible) => {
              setHotelsVisible(visible);
              updateMapState({ hotelsVisible: visible });
            }}
          />
        )}

        {showCompletionModal && (
          <CompletionModal
            isOpen={showCompletionModal}
            mountainName={mountain.ukHillsDbName}
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
            mountainId={mountain.id}
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