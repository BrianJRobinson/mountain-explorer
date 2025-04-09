'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { SitesCard } from './SitesCard';
import { useSession } from 'next-auth/react';
import { Site } from '@/app/types/Sites';
import { toast } from 'react-hot-toast';
import { SitesFilter } from './sites/SitesFilter';

interface SitesDirectoryProps {
  sites: Site[];
}

interface SiteCompletion {
  siteId: number;
}

export const SitesDirectory: React.FC<SitesDirectoryProps> = ({ sites }) => {
  const { data: session, status } = useSession();
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [showCompletedOnly, setShowCompletedOnly] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [completedSites, setCompletedSites] = useState<number[]>([]);
  const [isLoadingCompletions, setIsLoadingCompletions] = useState(true);
  const [columnCount, setColumnCount] = useState(4); // Default to 5 columns
  const [siteRatings, setSiteRatings] = useState<Record<number, { rating: number; comment: string; averageRating: number; totalRatings: number }>>({});
  const parentRef = useRef<HTMLDivElement>(null);


  // Initialize search from URL parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const searchParam = params.get('search');
      if (searchParam) {
        setSearchQuery(searchParam);
        setDebouncedSearch(searchParam);
      }
    }
  }, []);

  // Card dimensions
  const IMAGE_HEIGHT = 152; // h-38
  const CONTENT_HEIGHT = 240; // Content section height
  const CARD_HEIGHT = IMAGE_HEIGHT + CONTENT_HEIGHT;
  const ROW_GAP = 8; // gap-4 instead of gap-6

  const fetchCompletedSites = useCallback(async () => {
    try {
      if (!session?.user?.id) {
        console.log('No user ID available, skipping fetch');
        setIsLoadingCompletions(false);
        return;
      }

      setIsLoadingCompletions(true);
      
      const response = await fetch('/api/sites/completed', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setCompletedSites(data.map((completion: SiteCompletion) => completion.siteId));
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch completed sites:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          session: session
        });
      }
    } catch (error) {
      console.error('Error in fetchCompletedSites:', error);
    } finally {
      setIsLoadingCompletions(false);
    }
  }, [session]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchCompletedSites();
    }
  }, [session, status, fetchCompletedSites]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Update column count based on screen size
  useEffect(() => {
    const updateColumnCount = () => {
      const width = window.innerWidth;
      if (width < 768) setColumnCount(1); // mobile
      else if (width < 1024) setColumnCount(2); // tablet
      else if (width < 1280) setColumnCount(3); // laptop
      else setColumnCount(4); // desktop
    };

    updateColumnCount();
    window.addEventListener('resize', updateColumnCount);
    return () => window.removeEventListener('resize', updateColumnCount);
  }, []);

  const handleToggleCompletion = async (siteId: number, completed: boolean) => {
    try {
      console.log('[SitesDirectory] Starting toggle completion:', {
        siteId,
        completed,
        currentCompletedSites: completedSites
      });

      // Optimistically update the UI
      setCompletedSites(prev => {
        const newState = completed 
          ? [...prev, siteId]
          : prev.filter(id => id !== siteId);
        console.log('[SitesDirectory] Updated completedSites state:', {
          siteId,
          completed,
          previousState: prev,
          newState
        });
        return newState;
      });

      const response = await fetch('/api/sites/toggle-completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          siteId, 
          completed,
          userId: session?.user?.id 
        }),
      });

      if (!response.ok) {
        console.log('[SitesDirectory] API call failed, reverting state');
        // Revert the optimistic update on error
        setCompletedSites(prev => {
          const revertedState = completed 
            ? prev.filter(id => id !== siteId)
            : [...prev, siteId];
          console.log('[SitesDirectory] Reverted completedSites state:', {
            siteId,
            completed,
            previousState: prev,
            revertedState
          });
          return revertedState;
        });
        throw new Error('Failed to update completion status');
      }

      console.log('[SitesDirectory] Toggle completion successful:', {
        siteId,
        completed,
        currentCompletedSites: completedSites
      });

      // Show success toast
      toast.success(
        completed ? 'Site marked as completed!' : 'Site marked as not completed',
        { duration: 2000 }
      );

    } catch (error) {
      console.error('[SitesDirectory] Error in handleToggleCompletion:', error);
      toast.error('Failed to update completion status. Please try again.', {
        duration: 3000,
      });
      
      throw error;
    }
  };

  const handleMapMarkerClick = (siteName: string) => {
    setSearchQuery(siteName);
    setDebouncedSearch(siteName);
  };

  const handleSubmitRating = async (siteId: number, rating: number, comment: string) => {
    try {
      console.log('[SitesDirectory] Starting rating submission:', { 
        siteId, 
        rating, 
        comment,
        isCompleted: completedSites.includes(siteId)
      });
      
      const response = await fetch('/api/sites/rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId,
          rating,
          comment: comment.trim() || null
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit rating');
      }
      
      // Get the updated sites data
      const updatedRating = await response.json();
      console.log('[SitesDirectory] Rating submission successful:', {
        siteId,
        updatedRating,
        isCompleted: completedSites.includes(siteId)
      });

      // Update completion state since rating automatically completes the site
      if (!completedSites.includes(siteId)) {
        setCompletedSites(prev => [...prev, siteId]);
      }

      // Return the mountain with updated rating values
      const returnData = {
        ...updatedRating,
        averageRating: rating,
        totalRatings: 1,
        userRating: rating
      };

      console.log('[SitesDirectory] Returning data:', returnData);
      return returnData;

    } catch (error) {
      console.error('[SitesDirectory] Error in handleSubmitRating:', error);
      throw error;
    }
  };

  // Fetch user ratings for sites
  const fetchUserRatings = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch('/api/sites/user-ratings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        const ratingsMap = data.reduce((acc: Record<number, any>, rating: any) => {
          acc[rating.siteId] = {
            rating: rating.rating,
            comment: rating.comment,
            averageRating: rating.averageRating,
            totalRatings: rating.totalRatings
          };
          return acc;
        }, {});
        setSiteRatings(ratingsMap);
      }
    } catch (error) {
      console.error('Error fetching user ratings:', error);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchUserRatings();
    }
  }, [session, status, fetchUserRatings]);

  // Filter sites
  const filteredSites = sites; 
  console.log(filteredSites);
  /*const filteredSites = sites.features.filter(feature => {
    const matchesTypes = selectedTypes.length === 0 || 
      selectedTypes.some(type => feature.kinds.includes(type));
    const matchesSearch = feature.name.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesCompleted = showCompletedOnly === false || showCompletedOnly === null || completedSites.includes(feature.id);
    return matchesTypes && matchesSearch && matchesCompleted;
  });
*/
  // Calculate rows needed based on number of items and columns
  const rowCount = Math.ceil(filteredSites.length / columnCount);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => CARD_HEIGHT + ROW_GAP,
    overscan: 5,
  });

  const totalHeight = virtualizer.getTotalSize();

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen" id="sites">
      <div className="sticky top-16 z-40 bg-gray-900/95 backdrop-blur-sm py-4 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap gap-2 p-2 w-full md:w-auto bg-gray-900 rounded-xl shadow-inner">
            {/*<SitesFilter
              allTypes={allTypes}
              selectedTypes={selectedTypes}
              onTypeChange={setSelectedTypes}
              siteCounts={siteCounts}
            />*/}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setShowCompletedOnly(!showCompletedOnly);
              }}
              className={`px-6 py-2 rounded-lg transition-all duration-200 ${
                showCompletedOnly
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 shadow-inner border border-gray-700'
              }`}
            >
              Completed ({completedSites.length})
            </button>            
          </div>
          <div className="w-full md:w-auto relative">
            <input
              type="text"
              placeholder="Search sites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 pl-4 pr-10 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setDebouncedSearch('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                aria-label="Clear search"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      <div 
        ref={parentRef}
        className="h-[800px] overflow-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-thumb]:bg-orange-500/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-orange-500/70"
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(249, 115, 22, 0.5) rgb(31, 41, 55)'
        }}
      >
        <div
          style={{
            height: `${totalHeight}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            console.log(filteredSites);
            const startIndex = virtualRow.index * columnCount;
            const rowSites = filteredSites.slice(startIndex, startIndex + columnCount);

            return (
              <div
                key={virtualRow.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div 
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                  style={{ height: CARD_HEIGHT }}
                >
                  {rowSites.map((site) => (
                    <SitesCard
                      key={site.id}
                      site={site}
                      isCompleted={completedSites.includes(site.id)}
                      onToggleCompletion={handleToggleCompletion}
                      isInitialLoading={status === 'authenticated' && isLoadingCompletions}
                      allSites={sites}
                      onMapMarkerClick={handleMapMarkerClick}
                      onSubmitRating={handleSubmitRating}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}; 