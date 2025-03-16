'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Mountain } from '@/app/types/Mountain';

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
  const ignoreNextPropChange = useRef(false);
  const categoryName = mountain.MountainCategoryID === 12 ? 'Munro' : 'Corbett';

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
    
    // Set flag to ignore the next prop change since we're triggering it
    ignoreNextPropChange.current = true;
    
    // Update visual state immediately
    setCurrentState(newState);
    setIsUpdating(true);

    try {
      // Call the API
      await onToggleCompletion(mountain.id, newState);
      // Keep our flag true since the API succeeded
      ignoreNextPropChange.current = true;
    } catch (error) {
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

  return (
    <div className={`
      group relative bg-gray-800 rounded-xl overflow-hidden transform hover:-translate-y-1 transition-all duration-300
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

      <div 
        className="h-48 bg-cover bg-center relative"
        style={{
          backgroundImage: `url(${getCategoryImage(mountain.MountainCategoryID)})`
        }}
      >
        {/* Gradient overlay that becomes more transparent on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent opacity-90 group-hover:opacity-75 transition-opacity duration-300 z-10" />
        
        {/* Mountain name with glow effect */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
          <h3 className="text-xl font-bold text-white drop-shadow-lg group-hover:text-orange-100 transition-colors duration-300">
            {mountain.ukHillsDbName}
          </h3>
        </div>
      </div>

      <div className="p-4 space-y-3 bg-gradient-to-b from-gray-800 to-gray-900 relative z-30">
        {/* Height with glowing effect */}
        <div className="flex items-center text-gray-300 group-hover:text-gray-200">
          <svg className="w-5 h-5 mr-2 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span className="font-medium text-lg group-hover:text-gray-100">
            {mountain.Height}m
          </span>
        </div>

        {/* Location with hover effect */}
        <div className="flex items-center text-gray-400 group-hover:text-gray-300">
          <svg className="w-5 h-5 mr-2 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm group-hover:text-gray-200 transition-colors duration-300">
            {mountain.ukHillsDbLatitude}, {mountain.ukHillsDbLongitude}
          </span>
        </div>

        {/* Region with dark theme */}
        <div className="flex items-center text-gray-400 group-hover:text-gray-300">
          <svg className="w-5 h-5 mr-2 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm group-hover:text-gray-200 transition-colors duration-300">
            Region {mountain.ukHillsDbSection}
          </span>
        </div>

        {/* Completion Toggle */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-700/50 relative z-40">
          <span className="text-sm text-gray-400">
            {!session?.user ? 'Sign in to track progress' :
             isUpdating ? 'Updating...' : (currentState ? 'Completed' : 'Not completed')}
          </span>
          
          {session?.user && (
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
          )}
          {!session?.user && (
            <a href="/login" className="text-sm text-orange-400 hover:text-orange-300 transition-colors">
              Sign in
            </a>
          )}
        </div>
      </div>
    </div>
  );
}; 