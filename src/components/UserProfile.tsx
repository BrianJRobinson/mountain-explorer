import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { StarRating } from './shared/StarRating';
import { formatDistanceToNow } from 'date-fns';

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
  return (
    <div className="min-h-screen bg-gray-900 pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* User Header */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8 flex items-center gap-6">
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-orange-500">
            <Image
              src={`/avatars/${user.avatar === "default" ? 'Avatar1.webp' : user.avatar || 'Avatar1.webp'}`}
              alt={`${user.name || 'User'}'s avatar`}
              fill
              sizes="96px"
              className="object-cover"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">{user.name || 'Anonymous User'}</h1>
            <p className="text-gray-400">
              {comments.length} mountain {comments.length === 1 ? 'review' : 'reviews'}
            </p>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <Link 
                  href={`/mountain/${comment.mountain.id}`}
                  className="text-xl font-semibold text-orange-400 hover:text-orange-300 transition-colors"
                >
                  {comment.mountain.ukHillsDbName}
                </Link>
                <div className="text-sm text-gray-400">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </div>
              </div>
              <div className="mb-3">
                <StarRating rating={comment.rating} size="sm" />
              </div>
              <p className="text-gray-300">{comment.comment}</p>
              <div className="mt-4 text-sm text-gray-400">
                Height: {comment.mountain.Height}m • Region: {comment.mountain.ukHillsDbSection}
              </div>
            </div>
          ))}
        </div>

        {comments.length === 0 && (
          <div className="bg-gray-800 rounded-xl p-6 text-center">
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