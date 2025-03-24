'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { StarRating } from './shared/StarRating';
import { formatDistanceToNow } from 'date-fns';
import { useSession } from 'next-auth/react';

interface UserProfileProps {
  user: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
  comments: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: Date;
    mountain: {
      id: number;
      ukHillsDbName: string;
      Height: number;
      ukHillsDbSection: string;
    };
  }>;
  isOwnProfile: boolean;
}

export function UserProfile({ user, comments, isOwnProfile }: UserProfileProps) {
  const { data: session } = useSession();
  const [followStats, setFollowStats] = useState({
    followingCount: 0,
    followersCount: 0,
    isFollowing: false,
  });
  const [isLoading, setIsLoading] = useState(true);

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

    try {
      const response = await fetch('/api/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetUserId: user.id }),
      });

      const data = await response.json();
      setFollowStats(prev => ({
        ...prev,
        isFollowing: data.following,
        followersCount: data.following ? prev.followersCount + 1 : prev.followersCount - 1,
      }));
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 pt-20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* User Header */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8 flex items-center justify-between shadow-lg border border-gray-700/50 animate-float">
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-orange-500 shadow-lg animate-glow group transition-transform duration-300 hover:scale-105">
              <Image
                src={`/avatars/${user.avatar === "default" ? 'Avatar1.webp' : user.avatar || 'Avatar1.webp'}`}
                alt={`${user.name || 'User'}'s avatar`}
                fill
                sizes="96px"
                className="object-cover transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-2 hover:text-orange-400 transition-colors">{user.name || 'Anonymous User'}</h1>
              <div className="flex items-center gap-4 text-gray-400">
                <p>{comments.length} mountain {comments.length === 1 ? 'review' : 'reviews'}</p>
                {!isLoading && (
                  <>
                    <p>{followStats.followersCount} followers</p>
                    <p>{followStats.followingCount} following</p>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {!isOwnProfile && session?.user && (
              <button
                onClick={handleFollowToggle}
                className={`px-4 py-2 rounded-lg transition-colors duration-300 ${
                  followStats.isFollowing
                    ? 'bg-orange-500 hover:bg-orange-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              >
                {followStats.isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
            <Link 
              href="/"
              className="text-orange-500 hover:text-orange-400 transition-colors"
            >
              Back to Home ↩
            </Link>
          </div>
        </div>

        {/* Comments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {comments.map((comment, index) => (
            <div 
              key={comment.id} 
              className="bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-orange-500/10 group animate-slide-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Mountain Name Header */}
              <div className="bg-gray-700/50 p-4 border-b border-gray-700/50 transition-colors duration-300 group-hover:bg-gray-700/70">
                <Link 
                  href={`/mountain/${comment.mountain.id}`}
                  className="text-xl font-semibold text-orange-400 hover:text-orange-300 transition-all duration-300 line-clamp-1 group-hover:scale-105 inline-block"
                >
                  {comment.mountain.ukHillsDbName}
                </Link>
                <div className="flex items-center justify-between mt-2">
                  <div className="group">
                    <StarRating 
                      rating={comment.rating} 
                      size="sm"
                    />
                  </div>
                  <div className="text-sm text-gray-400 transition-colors group-hover:text-gray-300">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </div>
              
              {/* Comment Body */}
              <div className="p-4 transition-colors duration-300 group-hover:bg-gray-800/70">
                <p className="text-gray-300 mb-4 min-h-[3rem] line-clamp-3 transition-colors group-hover:text-white">
                  {comment.comment || 'No comment provided'}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-400 pt-2 border-t border-gray-700/50">
                  <div className="transition-transform duration-300 group-hover:translate-x-1">Height: {comment.mountain.Height}m</div>
                  <div className="transition-transform duration-300 group-hover:-translate-x-1">Region: {comment.mountain.ukHillsDbSection}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {comments.length === 0 && (
          <div className="bg-gray-800 rounded-xl p-6 text-center shadow-lg border border-gray-700/50 animate-float">
            <p className="text-gray-400">
              {isOwnProfile 
                ? "You haven't left any mountain reviews yet."
                : "This user hasn't left any mountain reviews yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 