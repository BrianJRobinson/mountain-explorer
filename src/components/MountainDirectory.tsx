'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { MountainCard } from './MountainCard';
import { useSession } from 'next-auth/react';
import { Mountain } from '@/app/types/Mountain';
import { toast } from 'react-hot-toast';

interface MountainDirectoryProps {
  mountains: Mountain[];
}

interface MountainCompletion {
  mountainId: number;
}

export const MountainDirectory: React.FC<MountainDirectoryProps> = ({ mountains }) => {
  const { data: session, status } = useSession();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showCompletedOnly, setShowCompletedOnly] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [completedMountains, setCompletedMountains] = useState<number[]>([]);
  const [isLoadingCompletions, setIsLoadingCompletions] = useState(true);
  const [columnCount, setColumnCount] = useState(5); // Default to 5 columns
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

  const fetchCompletedMountains = useCallback(async () => {
    try {
      if (!session?.user?.id) {
        console.log('No user ID available, skipping fetch');
        setIsLoadingCompletions(false);
        return;
      }

      setIsLoadingCompletions(true);
      
      const response = await fetch('/api/mountains/completed', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setCompletedMountains(data.map((completion: MountainCompletion) => completion.mountainId));
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch completed mountains:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          session: session
        });
      }
    } catch (error) {
      console.error('Error in fetchCompletedMountains:', error);
    } finally {
      setIsLoadingCompletions(false);
    }
  }, [session]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchCompletedMountains();
    }
  }, [session, status, fetchCompletedMountains]);

  useEffect(() => {
    console.log('Session status:', status);
    console.log('Session data:', session);
    if (status === 'unauthenticated') {
      console.log('User is not authenticated');
    } else if (status === 'loading') {
      console.log('Session is loading...');
    } else if (status === 'authenticated') {
      console.log('User is authenticated:', session?.user);
      console.log('User ID:', session?.user?.id);
    }
  }, [session, status]);

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
      else setColumnCount(5); // desktop
    };

    updateColumnCount();
    window.addEventListener('resize', updateColumnCount);
    return () => window.removeEventListener('resize', updateColumnCount);
  }, []);

  const handleToggleCompletion = async (mountainId: number, completed: boolean) => {
    try {
      console.log('[MountainDirectory] Starting toggle completion:', {
        mountainId,
        completed,
        currentCompletedMountains: completedMountains
      });

      // Optimistically update the UI
      setCompletedMountains(prev => {
        const newState = completed 
          ? [...prev, mountainId]
          : prev.filter(id => id !== mountainId);
        console.log('[MountainDirectory] Updated completedMountains state:', {
          mountainId,
          completed,
          previousState: prev,
          newState
        });
        return newState;
      });

      const response = await fetch('/api/mountains/toggle-completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          mountainId, 
          completed,
          userId: session?.user?.id 
        }),
      });

      if (!response.ok) {
        console.log('[MountainDirectory] API call failed, reverting state');
        // Revert the optimistic update on error
        setCompletedMountains(prev => {
          const revertedState = completed 
            ? prev.filter(id => id !== mountainId)
            : [...prev, mountainId];
          console.log('[MountainDirectory] Reverted completedMountains state:', {
            mountainId,
            completed,
            previousState: prev,
            revertedState
          });
          return revertedState;
        });
        throw new Error('Failed to update completion status');
      }

      console.log('[MountainDirectory] Toggle completion successful:', {
        mountainId,
        completed,
        currentCompletedMountains: completedMountains
      });

      // Show success toast
      toast.success(
        completed ? 'Mountain marked as completed!' : 'Mountain marked as not completed',
        { duration: 2000 }
      );

    } catch (error) {
      console.error('[MountainDirectory] Error in handleToggleCompletion:', error);
      toast.error('Failed to update completion status. Please try again.', {
        duration: 3000,
      });
      
      throw error;
    }
  };

  const handleMapMarkerClick = (mountainName: string) => {
    setSearchQuery(mountainName);
    setDebouncedSearch(mountainName);
  };

  const handleSubmitRating = async (mountainId: number, rating: number, comment: string) => {
    try {
      console.log('[MountainDirectory] Starting rating submission:', { 
        mountainId, 
        rating, 
        comment,
        isCompleted: completedMountains.includes(mountainId)
      });
      
      const response = await fetch('/api/mountains/rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mountainId,
          rating,
          comment: comment.trim() || null
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit rating');
      }

      // Get the updated mountain data
      const updatedRating = await response.json();
      console.log('[MountainDirectory] Rating submission successful:', {
        mountainId,
        updatedRating,
        isCompleted: completedMountains.includes(mountainId)
      });

      // Update completion state since rating automatically completes the mountain
      if (!completedMountains.includes(mountainId)) {
        setCompletedMountains(prev => [...prev, mountainId]);
      }

      // Return the mountain with updated rating values
      const returnData = {
        ...updatedRating,
        averageRating: rating,
        totalRatings: 1,
        userRating: rating
      };

      console.log('[MountainDirectory] Returning data:', returnData);
      return returnData;
    } catch (error) {
      console.error('[MountainDirectory] Error in handleSubmitRating:', error);
      throw error;
    }
  };

  const filteredMountains = mountains.filter(mountain => {
    const matchesCategory = selectedCategory === null || mountain.MountainCategoryID === selectedCategory;
    const matchesSearch = mountain.ukHillsDbName.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesCompleted = showCompletedOnly === false || showCompletedOnly === null || completedMountains.includes(mountain.id);
    return matchesCategory && matchesSearch && matchesCompleted;
  });

  const munroCount = filteredMountains.filter(m => m.MountainCategoryID === 12).length;
  const corbettCount = filteredMountains.filter(m => m.MountainCategoryID === 11).length;

  // Calculate rows needed based on number of items and columns
  const rowCount = Math.ceil(filteredMountains.length / columnCount);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => CARD_HEIGHT + ROW_GAP,
    overscan: 5,
  });

  const totalHeight = virtualizer.getTotalSize();

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen" id="mountains">
      <div className="sticky top-16 z-40 bg-gray-900/95 backdrop-blur-sm py-4 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap gap-2 p-2 w-full md:w-auto bg-gray-900 rounded-xl shadow-inner">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setSelectedCategory(null);
              }}
              className={`px-6 py-2 rounded-lg transition-all duration-200 ${
                selectedCategory === null
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 shadow-inner border border-gray-700'
              }`}
            >
              All ({munroCount + corbettCount })
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setSelectedCategory(12);
              }}
              className={`px-6 py-2 rounded-lg transition-all duration-200 ${
                selectedCategory === 12
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 shadow-inner border border-gray-700'
              }`}
            >
              Munros ({munroCount})
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setSelectedCategory(11);
              }}
              className={`px-6 py-2 rounded-lg transition-all duration-200 ${
                selectedCategory === 11
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 shadow-inner border border-gray-700'
              }`}
            >
              Corbetts ({corbettCount})
            </button>
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
              Completed ({completedMountains.length})
            </button>            
          </div>
          <div className="w-full md:w-auto relative">
            <input
              type="text"
              placeholder="Search mountains..."
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
            const rowMountains = filteredMountains.slice(startIndex, startIndex + columnCount);

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
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
                  style={{ height: CARD_HEIGHT }}
                >
                  {rowMountains.map((mountain) => (
                    <MountainCard
                      key={mountain.id}
                      mountain={mountain}
                      isCompleted={completedMountains.includes(mountain.id)}
                      onToggleCompletion={handleToggleCompletion}
                      isInitialLoading={status === 'authenticated' && isLoadingCompletions}
                      allMountains={mountains}
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