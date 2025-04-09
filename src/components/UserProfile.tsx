'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { StarRating } from './shared/StarRating';
import { formatDistanceToNow } from 'date-fns';
import { useSession } from 'next-auth/react';
import { ToggleButton } from './shared/ToggleButton';
import { Navbar } from './Navbar';

interface BaseReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  type: 'mountain' | 'walk' | 'site';
}

interface MountainReview extends BaseReview {
  type: 'mountain';
  mountainId: number;
  mountain: {
    id: number;
    ukHillsDbName: string;
    Height: number;
    ukHillsDbSection: string;
  };
}

interface WalkReview extends BaseReview {
  type: 'walk';
  walkId: number;
  walk: {
    id: number;
    name: string;
    Distance_K: string;
    Distance_M: string;
  };
}

interface SiteReview extends BaseReview {
  type: 'site';
  siteId: number;
  site: {
    id: number;
    name: string;
    longitude: number;
    latitude: number;
    kinds: string;
  };
}

type Review = MountainReview | WalkReview | SiteReview;

interface UserProfileProps {
  user: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
  reviews: Review[];
  isOwnProfile: boolean;
}

export function UserProfile({ user, reviews, isOwnProfile }: UserProfileProps) {
  const { data: session } = useSession();
  const [followStats, setFollowStats] = useState({
    followingCount: 0,
    followersCount: 0,
    isFollowing: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingFollowing, setIsUpdatingFollowing] = useState(false);

  useEffect(() => {
    const fetchFollowStats = async () => {
      try {
        const response = await fetch(`/api/follow?userId=${user.id}`);
        const data = await response.json();
        setFollowStats(data);
      } catch (error) {
        console.error('Error fetching follow stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchFollowStats();
    } else {
      setIsLoading(false);
    }
  }, [user.id, session?.user]);

  const handleFollowToggle = async () => {
    if (!session?.user) return;

    setIsUpdatingFollowing(true);
    // Update optimistically
    setFollowStats(prev => ({
      ...prev,
      isFollowing: !prev.isFollowing,
      followersCount: !prev.isFollowing ? prev.followersCount + 1 : prev.followersCount - 1,
    }));

    try {
      const response = await fetch('/api/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetUserId: user.id }),
      });

      if (!response.ok) {
        // Revert on error
        setFollowStats(prev => ({
          ...prev,
          isFollowing: !prev.isFollowing,
          followersCount: prev.isFollowing ? prev.followersCount + 1 : prev.followersCount - 1,
        }));
      }
    } catch (error) {
      // Revert on error
      setFollowStats(prev => ({
        ...prev,
        isFollowing: !prev.isFollowing,
        followersCount: prev.isFollowing ? prev.followersCount + 1 : prev.followersCount - 1,
      }));
      console.error('Error toggling follow:', error);
    } finally {
      setIsUpdatingFollowing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* User Header */}
        <div className="bg-gray-800 rounded-xl p-4 mt-10 sm:p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center sm:justify-between shadow-lg border border-gray-700/50 animate-float gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-orange-500 shadow-lg animate-glow group transition-transform duration-300 hover:scale-105">
                <Image
                  src={`/avatars/${user.avatar === "default" ? 'Avatar1.webp' : user.avatar || 'Avatar1.webp'}`}
                  alt={`${user.name || 'User'}'s avatar`}
                  fill
                  sizes="(max-width: 640px) 80px, 96px"
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              {/* Show Follow button next to avatar in mobile view */}
              <div className="sm:hidden">
                {!isOwnProfile && session?.user && (
                  <div className="flex items-center gap-2">
                    <ToggleButton
                      isToggled={followStats.isFollowing}
                      onToggle={handleFollowToggle}
                      isLoading={isUpdatingFollowing}
                      label={followStats.isFollowing ? 'Unfollow user' : 'Follow user'}
                      size="sm"
                    />
                    <span className="text-sm text-gray-400">
                      {followStats.isFollowing ? 'Unfollow' : 'Follow'}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <h1 className="text-xl sm:text-2xl font-bold text-white hover:text-orange-400 transition-colors">{user.name || 'Anonymous User'}</h1>
                  {/* Show Follow button next to username in desktop view */}
                  <div className="hidden sm:block">
                    {!isOwnProfile && session?.user && (
                      <div className="flex items-center gap-2">
                        <ToggleButton
                          isToggled={followStats.isFollowing}
                          onToggle={handleFollowToggle}
                          isLoading={isUpdatingFollowing}
                          label={followStats.isFollowing ? 'Unfollow user' : 'Follow user'}
                          size="sm"
                        />
                        <span className="text-sm text-gray-400">
                          {followStats.isFollowing ? 'Unfollow' : 'Follow'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                <div className="flex items-center gap-4 text-sm sm:text-base text-gray-400">
                  <p>{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</p>
                </div>
                {!isLoading && (
                  <div className="flex items-center gap-4 text-sm sm:text-base text-gray-400">
                    <p>{followStats.followersCount} followers</p>
                    <p>{followStats.followingCount} following</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {reviews.map((review, index) => (
            <div 
              key={review.id} 
              className="bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-orange-500/10 group animate-slide-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Review Header */}
              <div className="bg-gray-700/50 p-4 border-b border-gray-700/50 transition-colors duration-300 group-hover:bg-gray-700/70">
                <div className="flex items-center gap-2">
                  {review.type === 'mountain' ? (
                    <svg className="w-10 h-5 text-blue-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg className="w-10 h-5 text-green-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 20L3 17V4L9 7M9 20L15 17M9 20V7M15 17L21 20V7L15 4M15 17V4M9 7L15 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  <Link 
                    href={review.type === 'mountain' 
                      ? `/?search=${encodeURIComponent(review.mountain.ukHillsDbName)}#mountains`
                      : review.type === 'walk'
                        ? `/?search=${encodeURIComponent(review.walk.name)}#walks`
                        : `/?search=${encodeURIComponent(review.site.name.length > 50 ? review.site.name.substring(0, 50) + '...' : review.site.name)}#sites`}
                    className="text-xl font-semibold text-orange-400 hover:text-orange-300 transition-all duration-300 line-clamp-1 group-hover:scale-105 inline-block"
                  >
                    {review.type === 'mountain' ? review.mountain.ukHillsDbName : review.type === 'site' ? review.site.name.length > 50 ? review.site.name.substring(0, 50) + '...' : review.site.name : review.walk.name.length > 50 ? review.walk.name.substring(0, 50) + '...' : review.walk.name}
                  </Link>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="group">
                    <StarRating 
                      rating={review.rating} 
                      size="sm"
                    />
                  </div>
                  <div className="text-sm text-gray-400 transition-colors group-hover:text-gray-300">
                    {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </div>
              
              {/* Review Body */}
              <div className="p-4 transition-colors duration-300 group-hover:bg-gray-800/70">
                <p className="text-gray-300 mb-4 min-h-[3rem] line-clamp-3 transition-colors group-hover:text-white">
                  {review.comment || 'No comment provided'}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-400 pt-2 border-t border-gray-700/50">
                  {review.type === 'mountain' ? (
                    <>
                      <div className="transition-transform duration-300 group-hover:translate-x-1">Height: {review.mountain.Height}m</div>
                      <div className="transition-transform duration-300 group-hover:-translate-x-1">Region: {review.mountain.ukHillsDbSection}</div>
                    </>
                  ) : review.type === 'walk' ? (
                    <>
                      <div className="transition-transform duration-300 group-hover:translate-x-1">Distance: {review.walk.Distance_K}km</div>
                      <div className="transition-transform duration-300 group-hover:-translate-x-1">{review.walk.Distance_M} miles</div>
                    </>
                  ) : (
                    <>
                      <div className="transition-transform duration-300 group-hover:translate-x-1">Latitude: {review.site.latitude}</div>
                      <div className="transition-transform duration-300 group-hover:-translate-x-1">Longitude: {review.site.longitude}</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {reviews.length === 0 && (
          <div className="bg-gray-800 rounded-xl p-6 text-center shadow-lg border border-gray-700/50 animate-float">
            <p className="text-gray-400">
              {isOwnProfile 
                ? "You haven't left any reviews yet."
                : "This user hasn't left any reviews yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 