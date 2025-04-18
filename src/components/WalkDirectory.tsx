'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { WalkCard } from './WalkCard';
import { useSession } from 'next-auth/react';
import { Walk } from '@/app/types/Walk';
import { toast } from 'react-hot-toast';

interface WalkDirectoryProps {
  walks: Walk[];
}

interface WalkCompletion {
  walkId: number;
}

export const WalkDirectory: React.FC<WalkDirectoryProps> = ({ walks }) => {
  const { data: session, status } = useSession();
  const [showCompletedOnly, setShowCompletedOnly] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [completedWalks, setCompletedWalks] = useState<number[]>([]);
  const [isLoadingCompletions, setIsLoadingCompletions] = useState(true);
  const [columnCount, setColumnCount] = useState(4); // Default to 5 columns
  const [walksWithComments, setWalksWithComments] = useState<Record<number, number>>({});
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

  const fetchCompletedWalks = useCallback(async () => {
    try {
      if (!session?.user?.id) {
        console.log('No user ID available, skipping fetch');
        setIsLoadingCompletions(false);
        return;
      }

      setIsLoadingCompletions(true);
      
      const response = await fetch('/api/walks/completed', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setCompletedWalks(data.map((completion: WalkCompletion) => completion.walkId));
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch completed walks:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          session: session
        });
      }
    } catch (error) {
      console.error('Error in fetchCompletedWalks:', error);
    } finally {
      setIsLoadingCompletions(false);
    }
  }, [session]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchCompletedWalks();
    }
  }, [session, status, fetchCompletedWalks]);

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

  // Add this function to update a single walk's comment count
  const updateWalkCommentCount = useCallback((walkId: number, increment: boolean = true) => {
    setWalksWithComments(prev => {
      const newCounts = { ...prev };
      if (increment) {
        newCounts[walkId] = (newCounts[walkId] || 0) + 1;
      } else {
        // If decrementing and count would go to 0, remove the entry
        if (newCounts[walkId] && newCounts[walkId] > 1) {
          newCounts[walkId] = newCounts[walkId] - 1;
        } else {
          delete newCounts[walkId];
        }
      }
      return newCounts;
    });
  }, []);

  // Improve the fetchCommentCounts function with retry logic
  const fetchCommentCounts = useCallback(async (retryCount = 0) => {
    try {
      const response = await fetch('/api/walks/comments/counts');
      if (!response.ok) throw new Error('Failed to fetch comment counts');
      const data = await response.json();
      setWalksWithComments(data);
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

  const handleToggleCompletion = async (walkId: number, completed: boolean) => {
    try {
      console.log('[WalkDirectory] Starting toggle completion:', {
        walkId,
        completed,
        currentCompletedWalks: completedWalks
      });

      // Optimistically update the UI
      setCompletedWalks(prev => {
        const newState = completed 
          ? [...prev, walkId]
          : prev.filter(id => id !== walkId);
        console.log('[WalkDirectory] Updated completedWalks state:', {
          walkId,
          completed,
          previousState: prev,
          newState
        });
        return newState;
      });

      const response = await fetch('/api/walks/toggle-completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          walkId, 
          completed,
          userId: session?.user?.id 
        }),
      });

      if (!response.ok) {
        console.log('[WalkDirectory] API call failed, reverting state');
        // Revert the optimistic update on error
        setCompletedWalks(prev => {
          const revertedState = completed 
            ? prev.filter(id => id !== walkId)
            : [...prev, walkId];
          console.log('[WalkDirectory] Reverted completedWalks state:', {
            walkId,
            completed,
            previousState: prev,
            revertedState
          });
          return revertedState;
        });
        throw new Error('Failed to update completion status');
      }

      console.log('[WalkDirectory] Toggle completion successful:', {
        walkId,
        completed,
        currentCompletedWalks: completedWalks
      });

      // Show success toast
      toast.success(
        completed ? 'Walk marked as completed!' : 'Walk marked as not completed',
        { duration: 2000 }
      );

    } catch (error) {
      console.error('[WalkDirectory] Error in handleToggleCompletion:', error);
      toast.error('Failed to update completion status. Please try again.', {
        duration: 3000,
      });
      
      throw error;
    }
  };

  const handleSubmitRating = async (walkId: number, rating: number, comment: string) => {
    try {
      console.log('[WalkDirectory] Starting rating submission:', { 
        walkId, 
        rating, 
        comment,
        isCompleted: completedWalks.includes(walkId)
      });
      
      // Optimistically update comment count if a comment is provided
      if (comment.trim()) {
        updateWalkCommentCount(walkId, true);
      }
      
      const response = await fetch('/api/walks/rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walkId,
          rating,
          comment: comment.trim() || null
        }),
      });

      if (!response.ok) {
        // Revert optimistic update on error
        if (comment.trim()) {
          updateWalkCommentCount(walkId, false);
        }
        
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit rating');
      }

      // Get the updated walk data
      const updatedRating = await response.json();
      console.log('[WalkDirectory] Rating submission successful:', {
        walkId,
        updatedRating,
        isCompleted: completedWalks.includes(walkId)
      });

      // Update completion state since rating automatically completes the walk
      if (!completedWalks.includes(walkId)) {
        setCompletedWalks(prev => [...prev, walkId]);
      }

      // Refresh comment counts to ensure we have the latest data
      // This is a fallback in case the optimistic update missed something
      fetchCommentCounts();

      // Return the walk with updated rating values from the API
      return updatedRating;
    } catch (error) {
      console.error('[WalkDirectory] Error in handleSubmitRating:', error);
      throw error;
    }
  };

  const filteredWalks = walks.filter(walk => {
    const matchesSearch = walk.name.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesCompleted = showCompletedOnly === false || showCompletedOnly === null || completedWalks.includes(walk.id);
    return matchesSearch && matchesCompleted;
  });

  // Calculate rows needed based on number of items and columns
  const rowCount = Math.ceil(filteredWalks.length / columnCount);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => CARD_HEIGHT + ROW_GAP,
    overscan: 5,
  });

  const totalHeight = virtualizer.getTotalSize();

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen" id="walks">
      <div className="sticky top-16 z-40 bg-gray-900/95 backdrop-blur-sm py-4 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap gap-2 p-2 w-full md:w-auto bg-gray-900 rounded-xl shadow-inner">
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
              Completed ({completedWalks.length})
            </button>            
          </div>
          <div className="w-full md:w-auto relative">
            <input
              type="text"
              placeholder="Search walks..."
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
            const startIndex = virtualRow.index * columnCount;
            const rowWalks = filteredWalks.slice(startIndex, startIndex + columnCount);

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
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  style={{ height: CARD_HEIGHT }}
                >
                  {rowWalks.map((walk) => (
                    <WalkCard
                      key={walk.id}
                      walk={walk}
                      isCompleted={completedWalks.includes(walk.id)}
                      onToggleCompletion={handleToggleCompletion}
                      isInitialLoading={status === 'authenticated' && isLoadingCompletions}
                      onSubmitRating={handleSubmitRating}
                      hasComments={walksWithComments[walk.id] > 0}
                      commentCount={walksWithComments[walk.id] || 0}
                      onCommentAdded={() => updateWalkCommentCount(walk.id, true)}
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