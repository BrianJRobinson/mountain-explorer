'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Site } from '@/app/types/Sites';
import { toast } from 'react-hot-toast';
import type { Map as LeafletMap } from 'leaflet';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { SitesCardHeader } from './SitesCard/SitesCardHeader';
import { SitesDetails } from './SitesCard/SitesDetails';
import { RatingPanel } from './SitesCard/RatingPanel';
import { SitesCardFooter } from './SitesCard/SitesCardFooter';
import { CompletionModal } from './SitesCard/CompletionModal';
import { CommentsModal } from './SitesCard/CommentsModal';
import { CompletionCelebration } from './shared/CompletionCelebration';
import { loadMapLibraries } from '@/lib/mapLibraries';

interface SitesCardProps {
  site: Site;
  isCompleted?: boolean;
  onToggleCompletion: (siteId: number, completed: boolean) => Promise<void>;
  isInitialLoading?: boolean;
  allSites: Site[];
  onMapMarkerClick?: (siteName: string) => void;
  onSubmitRating: (siteId: number, rating: number, comment: string) => Promise<Site>;
}

// Dynamic imports for mapping libraries
// @ts-expect-error - These libraries do work at runtime despite the type error
let L: typeof import('leaflet')['default'] | undefined;
// @ts-expect-error - These libraries do work at runtime despite the type error
let maplibregl: typeof import('maplibre-gl')['default'] | undefined;

// Load libraries on mount
if (typeof window !== 'undefined') {
  loadMapLibraries().then(({ leaflet, maplibre }) => {
    L = leaflet;
    maplibregl = maplibre;
  });
}

export const SitesCard: React.FC<SitesCardProps> = ({
  site,
  isCompleted: initialIsCompleted = false,
  onToggleCompletion,
  isInitialLoading = false,
  allSites,
  onMapMarkerClick,
  onSubmitRating,
}) => {
  const { data: session } = useSession();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showRatingPanel, setShowRatingPanel] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number>();
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [is3DMode] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [hasComments, setHasComments] = useState(false);

  // Derived state
  const hasUserRated = !!site.userRating;
  const userRating = site.userRating;
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const maplibreMap = useRef<MapLibreMap | null>(null);
  const markers3D = useRef<maplibregl.Marker[]>([]);

  // Check if there are comments when component mounts
  useEffect(() => {
    const checkComments = async () => {
      try {
        const response = await fetch(`/api/sites/comments/count?siteId=${site.id}`);
        if (!response.ok) throw new Error('Failed to check comments');
        const data = await response.json();
        setHasComments(data.count > 0);
      } catch (error) {
        console.error('Error checking comments:', error);
      }
    };

    checkComments();
  }, [site.id]);

  // Initialize 3D map
  const initialize3DMap = useCallback(() => {
    if (!maplibregl || !mapContainer.current) return;
    
    // Clean up existing 2D map if it exists
    if (map.current) {
      map.current.remove();
      map.current = null;
    }

    // Clean up existing 3D map if it exists
    if (maplibreMap.current) {
      markers3D.current.forEach(marker => marker.remove());
      markers3D.current = [];
      maplibreMap.current.remove();
      maplibreMap.current = null;
    }

    const lat = site.latitude;
    const lng = site.longitude;

    // Add styles for 3D markers
    const style = document.createElement('style');
    style.setAttribute('data-site-marker', 'true');
    style.textContent = `
      .site-marker {
        cursor: pointer;
        width: 24px;
        height: 24px;
        transform: translate(-50%, -50%);
      }
      .site-marker div {
        transform-origin: center;
        transform: rotateX(45deg);
        transition: transform 0.3s ease;
      }
      .site-marker:hover div {
        transform: rotateX(45deg) scale(1.1);
      }
    `;
    document.head.appendChild(style);

    const mapOptions: maplibregl.MapOptions = {
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'osm-layer',
            type: 'raster',
            source: 'osm',
            paint: {
              'raster-opacity': 1
            }
          }
        ]
      },
      center: [lng, lat],
      zoom: 14,
      pitch: 0,
      bearing: 0
    };

    maplibreMap.current = new maplibregl.Map(mapOptions);

    // Wait for map to load
    maplibreMap.current?.on('load', () => {
      if (!maplibreMap.current) return;

      // Add markers
      allSites.forEach((s) => {
        if (!maplibreMap.current) return;
        
        const el = document.createElement('div');
        el.className = 'site-marker';
        
        const marker = new maplibregl.Marker(el)
          .setLngLat([s.longitude, s.latitude])
          .addTo(maplibreMap.current);

        // Create popup content
        const popupContent = document.createElement('div');
        popupContent.className = 'text-center bg-white p-2 rounded-lg';
        popupContent.innerHTML = `
          <strong class="text-gray-900">${s.name}</strong><br/>
          <span class="text-gray-700">${s.kinds}</span><br/>
        `;

        // Create button element
        const button = document.createElement('button');
        button.className = 'px-2 py-1 mt-2 bg-orange-500 text-white rounded-md text-sm cursor-pointer hover:bg-orange-600';
        button.textContent = 'Show Details';
        button.onclick = () => {
          if (onMapMarkerClick) {
            onMapMarkerClick(s.name);
            setShowMap(false);
          }
        };

        popupContent.appendChild(button);

        // Add popup to marker
        const popup = new maplibregl.Popup({
          offset: 25,
          closeButton: false,
          className: 'site-popup'
        })
        .setDOMContent(popupContent);

        marker.setPopup(popup);
        markers3D.current.push(marker);
      });
    });

  }, [site.latitude, site.longitude, site.name, site.id, allSites, onMapMarkerClick]);

  const handleSubmitRating = async () => {
    if (!selectedRating) return;

    try {
      console.log('[SitesCard] Starting rating submission:', {
        siteId: site.id,
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

      console.log('[SitesCard] Received updated site:', {
        updatedSite,
        willSetUserRating: selectedRating,
        willSetUserComment: comment.trim() || undefined,
        willSetAverageRating: updatedSite.averageRating,
        willSetTotalRatings: updatedSite.totalRatings
      });
      
      site.userRating = selectedRating;
      site.userComment = comment.trim() || undefined;
      site.averageRating = updatedSite.averageRating;
      site.totalRatings = updatedSite.totalRatings;

      console.log('[SitesCard] Updated site object:', {
        newUserRating: site.userRating,
        newUserComment: site.userComment,
        newAverageRating: site.averageRating,
        newTotalRatings: site.totalRatings
      });
      
      // Set hasComments to true if a comment was provided
      if (comment.trim()) {
        setHasComments(true);
      }
      setShowRatingPanel(false);
      setShowCompletionModal(false);
      
      toast.success('Rating submitted successfully!');

    } catch (error) {
      console.error('[SitesCard] Error in handleSubmitRating:', error);
      toast.error('Failed to submit rating');
    } finally {
      setIsSubmitting(false);
      setIsUpdating(false);
    }
  };

  const handleToggle = async () => {
    if (!session?.user || isUpdating) return;
    
    try {
      console.log('[SitesCard] Starting toggle completion:', {
        siteId: site.id,
        currentlyCompleted: initialIsCompleted,
        willBeCompleted: !initialIsCompleted
      });

      setIsUpdating(true);
      await onToggleCompletion(site.id, !initialIsCompleted);
      
      console.log('[SitesCard] Toggle completion successful:', {
        siteId: site.id,
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
      console.error('[SitesCard] Error in handleToggle:', error);
      toast.error('Failed to update completion status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

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

      <SitesCardHeader
        name={site.name}
        kinds={site.kinds}
        isCompleted={initialIsCompleted}
        isUpdating={isUpdating}
        showToggle={!!session?.user}
        onToggleCompletion={handleToggle}
      />

      {/* Content Section - Fixed height */}
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
            {/* Site Details Content */}
            <div className="flex-1">
              <SitesDetails
                kinds={site.kinds}
                latitude={site.latitude}
                longitude={site.longitude}
                onShowMap={() => setShowMap(true)}
              />
            </div>

            <SitesCardFooter
              rating={site.averageRating}
              totalRatings={site.totalRatings}
              hasRecentComments={hasComments}
              isUserLoggedIn={!!session?.user}
              hasUserRated={hasUserRated}
              onShowComments={() => setShowComments(true)}
              onShowRatingPanel={() => setShowRatingPanel(true)}
            />
          </div>
        )}
      </div>

      {/* Map Modal */}
      {showMap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-gray-900 rounded-xl w-full max-w-4xl h-[80vh] relative">
            <button
              onClick={() => setShowMap(false)}
              className="absolute top-4 right-4 z-10 text-white hover:text-orange-400 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div ref={mapContainer} className="w-full h-full rounded-xl overflow-hidden" />
          </div>
        </div>
      )}

      {/* Modals */}
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
        />
      )}

      {/* Completion Celebration */}
      {showCelebration && (
        <CompletionCelebration onComplete={() => setShowCelebration(false)} />
      )}
    </div>
  );
}; 