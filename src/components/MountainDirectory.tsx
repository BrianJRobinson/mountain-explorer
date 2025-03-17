'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { MountainCard } from './MountainCard';
import { useSession } from 'next-auth/react';
import { Mountain } from '@/app/types/Mountain';
import toast from 'react-hot-toast';

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

  const handleToggleCompletion = async (mountainId: number, completed: boolean) => {
    try {
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
        throw new Error('Failed to update completion status');
      }

      // Only update parent state after successful API call
      setCompletedMountains(prev => 
        completed 
          ? [...prev, mountainId]
          : prev.filter(id => id !== mountainId)
      );

      // Show success toast
      toast.success(
        completed ? 'Mountain marked as completed!' : 'Mountain marked as not completed',
        { duration: 2000 }
      );

    } catch (error) {
      // Show error toast
      toast.error('Failed to update completion status. Please try again.', {
        duration: 3000,
      });
      
      // Return false to let the child component know it should revert
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

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen" id="mountains">
      <div className="sticky top-16 z-40 bg-gray-900/95 backdrop-blur-sm py-4 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex space-x-2 p-2 md:flex-row bg-gray-900 rounded-xl shadow-inner">
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
          <div className="w-full md:w-auto">
            <input
              type="text"
              placeholder="Search mountains..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 
                placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent
                shadow-inner"
            />
          </div>
        </div>
      </div>

      <div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6"
      >
        {filteredMountains.map((mountain) => (
          <MountainCard
            key={mountain.id}
            mountain={mountain}
            isCompleted={completedMountains.includes(mountain.id)}
            onToggleCompletion={handleToggleCompletion}
            isInitialLoading={status === 'authenticated' && isLoadingCompletions}
          />
        ))}
      </div>
    </div>
  );
}; 