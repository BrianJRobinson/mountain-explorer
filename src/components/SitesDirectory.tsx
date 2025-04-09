'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { SitesCard } from './SitesCard';
import { useSession } from 'next-auth/react';
import { Site } from '@/app/types/Sites';
import { toast } from 'react-hot-toast';

interface SitesDirectoryProps {
  sites: Site[];
}

interface SiteCompletion {
  siteId: number;
}

export const SitesDirectory: React.FC<SitesDirectoryProps> = ({ sites }) => {
  const { data: session, status } = useSession();
  const [showCompletedOnly, setShowCompletedOnly] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [completedSites, setCompletedSites] = useState<number[]>([]);
  const [isLoadingCompletions, setIsLoadingCompletions] = useState(true);
  const [columnCount, setColumnCount] = useState(4);
  const [sitesWithComments, setSitesWithComments] = useState<Record<number, number>>({});
  const parentRef = useRef<HTMLDivElement>(null);

  // Initialize search from URL parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const searchParam = params.get('search');
      if (searchParam) {
        setSearchQuery(searchParam);
      }
    }
  }, []);

  // Card dimensions
  const IMAGE_HEIGHT = 152; // h-38
  const CONTENT_HEIGHT = 240; // Content section height
  const CARD_HEIGHT = IMAGE_HEIGHT + CONTENT_HEIGHT;
  const ROW_GAP = 8; // gap-4

  // Add this function to update a single site's comment count
  const updateSiteCommentCount = useCallback((siteId: number, increment: boolean = true) => {
    setSitesWithComments(prev => {
      const newCounts = { ...prev };
      if (increment) {
        newCounts[siteId] = (newCounts[siteId] || 0) + 1;
      } else {
        // If decrementing and count would go to 0, remove the entry
        if (newCounts[siteId] && newCounts[siteId] > 1) {
          newCounts[siteId] = newCounts[siteId] - 1;
        } else {
          delete newCounts[siteId];
        }
      }
      return newCounts;
    });
  }, []);

  // Improve the fetchCommentCounts function with retry logic
  const fetchCommentCounts = useCallback(async (retryCount = 0) => {
    try {
      const response = await fetch('/api/sites/comments/counts');
      if (!response.ok) throw new Error('Failed to fetch comment counts');
      const data = await response.json();
      setSitesWithComments(data);
    } catch (error) {
      console.error('Error fetching comment counts:', error);
      
      // Retry up to 3 times with exponential backoff
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        setTimeout(() => fetchCommentCounts(retryCount + 1), delay);
      }
    }
  }, []);

  // Initial fetch of comment counts
  useEffect(() => {
    fetchCommentCounts();
  }, [fetchCommentCounts]);

  // Improve the polling mechanism with better error handling
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    
    const startPolling = () => {
      // Initial fetch
      fetchCommentCounts();
      
      // Set up polling
      pollInterval = setInterval(() => {
        fetchCommentCounts();
      }, 60000); // Poll every minute
    };
    
    startPolling();
    
    // Clean up on unmount
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [fetchCommentCounts]);

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
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (response.ok) {
        const data: SiteCompletion[] = await response.json();
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

  // Debounce search query directly in this effect
  const [effectiveSearchQuery, setEffectiveSearchQuery] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setEffectiveSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Update column count based on screen size
  useEffect(() => {
    const updateColumnCount = () => {
      const width = window.innerWidth;
      if (width < 768) setColumnCount(1);
      else if (width < 1024) setColumnCount(2);
      else if (width < 1280) setColumnCount(3);
      else setColumnCount(4);
    };
    updateColumnCount();
    window.addEventListener('resize', updateColumnCount);
    return () => window.removeEventListener('resize', updateColumnCount);
  }, []);

  const handleToggleCompletion = async (siteId: number, completed: boolean) => {
    try {
      console.log('[SitesDirectory] Starting toggle completion:', { siteId, completed, currentCompletedSites: completedSites });
      setCompletedSites(prev => {
        const newState = completed ? [...prev, siteId] : prev.filter(id => id !== siteId);
        console.log('[SitesDirectory] Updated completedSites state:', { siteId, completed, previousState: prev, newState });
        return newState;
      });
      const response = await fetch('/api/sites/toggle-completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, completed, userId: session?.user?.id }),
      });
      if (!response.ok) {
        console.log('[SitesDirectory] API call failed, reverting state');
        setCompletedSites(prev => {
          const revertedState = completed ? prev.filter(id => id !== siteId) : [...prev, siteId];
          console.log('[SitesDirectory] Reverted completedSites state:', { siteId, completed, previousState: prev, revertedState });
          return revertedState;
        });
        throw new Error('Failed to update completion status');
      }
      console.log('[SitesDirectory] Toggle completion successful:', { siteId, completed, currentCompletedSites: completedSites });
      toast.success(completed ? 'Site marked as completed!' : 'Site marked as not completed', { duration: 2000 });
    } catch (error) {
      console.error('[SitesDirectory] Error in handleToggleCompletion:', error);
      toast.error('Failed to update completion status. Please try again.', { duration: 3000 });
      throw error;
    }
  };

  const handleMapMarkerClick = (siteName: string) => {
    setSearchQuery(siteName);
  };

  const handleSubmitRating = async (siteId: number, rating: number, comment: string): Promise<Site> => {
    try {
      console.log('[SitesDirectory] Starting rating submission:', { siteId, rating, comment, isCompleted: completedSites.includes(siteId) });
      
      // Optimistically update comment count if a comment is provided
      if (comment.trim()) {
        updateSiteCommentCount(siteId, true);
      }
      
      const response = await fetch('/api/sites/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, rating, comment: comment.trim() || null }),
      });
      if (!response.ok) {
        // Revert optimistic update on error
        if (comment.trim()) {
          updateSiteCommentCount(siteId, false);
        }
        
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit rating');
      }
      const updatedRatingData = await response.json();
      console.log('[SitesDirectory] Rating submission successful:', { siteId, updatedRating: updatedRatingData, isCompleted: completedSites.includes(siteId) });
      if (!completedSites.includes(siteId)) {
        setCompletedSites(prev => [...prev, siteId]);
      }
      
      // Refresh comment counts to ensure we have the latest data
      // This is a fallback in case the optimistic update missed something
      fetchCommentCounts();
      
      const originalSite = sites.find(s => s.id === siteId);
      if (!originalSite) {
          console.error(`Site with ID ${siteId} not found in original list.`);
          throw new Error(`Site data inconsistency for ID ${siteId}`);
      }
      const returnData: Site = {
        ...originalSite,
        userRating: rating,
        userComment: comment.trim() || undefined,
        averageRating: updatedRatingData.averageRating, 
        totalRatings: updatedRatingData.totalRatings,
      };
      console.log('[SitesDirectory] Returning data:', returnData);
      return returnData;
    } catch (error) {
      console.error('[SitesDirectory] Error in handleSubmitRating:', error);
      throw error;
    }
  };

  // Filtered and sorted sites logic
  const filteredSites = React.useMemo(() => {
    let tempSites = [...sites];

    if (showCompletedOnly !== null) {
      tempSites = tempSites.filter(site => {
        const isCompleted = completedSites.includes(site.id);
        return showCompletedOnly === isCompleted;
      });
    }

    if (effectiveSearchQuery) {
      const lowerCaseQuery = effectiveSearchQuery.toLowerCase();
      tempSites = tempSites.filter(site =>
        site.name.toLowerCase().includes(lowerCaseQuery) ||
        site.kinds.toLowerCase().includes(lowerCaseQuery)
      );
    }

    return tempSites;
  }, [
    sites, 
    showCompletedOnly, 
    completedSites, 
    effectiveSearchQuery
  ]);

  // Virtualizer setup
  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(filteredSites.length / columnCount),
    getScrollElement: () => parentRef.current,
    estimateSize: () => CARD_HEIGHT + ROW_GAP,
    overscan: 5,
  });

  return (
    <div className="p-4 md:p-8">
      {/* ===== INSERTED STICKY HEADER ===== */}
      <div className="sticky top-16 z-40 bg-gray-900/95 backdrop-blur-sm py-4 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap gap-2 p-2 w-full md:w-auto bg-gray-900 rounded-xl shadow-inner">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                // Use existing state setter
                setShowCompletedOnly(prev => prev === null ? true : !prev);
              }}
              className={`px-6 py-2 rounded-lg transition-all duration-200 ${
                // Use existing state variable
                showCompletedOnly
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 shadow-inner border border-gray-700'
              }`}
            >
              {/* Use existing state variable */}
              Completed ({completedSites.length})
            </button>            
          </div>
          <div className="w-full md:w-auto relative">
            <input
              type="text"
              // Update placeholder
              placeholder="Search sites..."
              // Use existing state variable
              value={searchQuery}
              // Use existing state setter
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 pl-4 pr-10 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent shadow-inner"
            />
            {/* Use existing state variable */}
            {searchQuery && (
              <button
                onClick={() => {
                  // Use existing state setter
                  setSearchQuery('');
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
      {/* ===== END INSERTED STICKY HEADER ===== */}

      {/* Filter Section - Keep or remove based on whether filter UI is intended */}
      {/* <SitesFilter 
        onTypeChange={setSelectedTypes} 
        onCompletionChange={setShowCompletedOnly} 
        onSearchChange={setSearchQuery}
        initialSearch={searchQuery}
      /> */}
      
      {/* Status Message */}
      {status === 'unauthenticated' && !isLoadingCompletions && <p className="text-center text-gray-400">Sign in to track completed sites and ratings.</p>}

      {/* Grid Container */}
      <div 
        ref={parentRef} 
        className="w-full overflow-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-thumb]:bg-orange-500/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-orange-500/70" 
        style={{ 
          height: 'calc(100vh - 200px)',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(249, 115, 22, 0.5) rgb(31, 41, 55)',
          paddingRight: `${ROW_GAP}px`
        }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const rowItems = [];
            const firstItemIndex = virtualRow.index * columnCount;
            const lastItemIndex = Math.min(
              firstItemIndex + columnCount,
              filteredSites.length
            );

            for (let i = firstItemIndex; i < lastItemIndex; i++) {
              const site = filteredSites[i];
              rowItems.push(
                <div 
                  key={site.id} 
                  style={{ 
                    width: `calc((100% - (${ROW_GAP}px * ${columnCount - 1})) / ${columnCount})` 
                  }}
                >
                  <SitesCard
                    site={site}
                    isCompleted={completedSites.includes(site.id)}
                    onToggleCompletion={(siteId, completed) => handleToggleCompletion(siteId, completed)}
                    allSites={filteredSites}
                    onMapMarkerClick={handleMapMarkerClick}
                    onSubmitRating={handleSubmitRating}
                    hasComments={sitesWithComments[site.id] > 0}
                    commentCount={sitesWithComments[site.id] || 0}
                    onCommentAdded={() => updateSiteCommentCount(site.id, true)}
                    isInitialLoading={status === 'loading' || isLoadingCompletions}
                  />
                </div>
              );
            }

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
                  display: 'flex',
                  gap: `${ROW_GAP}px`, 
                  paddingBottom: `${ROW_GAP}px`,
                }}
              >
                {rowItems}
              </div>
            );
          })}
        </div>
      </div>
      {filteredSites.length === 0 && status !== 'loading' && !isLoadingCompletions && (
        <p className="text-center text-gray-500 mt-8">No sites match your current filters.</p>
      )}
    </div>
  );
}; 