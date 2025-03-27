import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { StarRating } from '../shared/StarRating';
import { toast } from 'react-hot-toast';

export interface Comment {
  userId: string;
  userName: string | null;
  userAvatar?: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
}

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  walkId: number;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({
  isOpen,
  onClose,
  walkId,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchComments = async () => {
        try {
          setIsLoading(true);
          const response = await fetch(`/api/walks/comments?walkId=${walkId}`);
          if (!response.ok) throw new Error('Failed to fetch comments');
          const data = await response.json();
          setComments(data);
        } catch (error) {
          console.error('Error fetching comments:', error);
          toast.error('Failed to load comments');
        } finally {
          setIsLoading(false);
        }
      };

      fetchComments();
    }
  }, [isOpen, walkId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center">
      <div className="bg-gray-800 rounded-xl shadow-xl border border-orange-500/20 w-full max-w-md mx-4">
        <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">Recent Comments</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 space-y-4 min-h-[200px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-[152px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : comments.length > 0 ? (
            comments.map((comment, index) => (
              <div key={index} className="text-sm flex gap-3">
                <div className="flex-shrink-0">
                  <Link href={`/user/${comment.userId}`} className="block">
                    <div className="w-8 h-8 rounded-full overflow-hidden relative hover:ring-2 hover:ring-orange-500 transition-all">
                      <Image
                        src={`/avatars/${comment.userAvatar === "default" ? 'Avatar1.webp' : comment.userAvatar || 'Avatar1.webp'}`}
                        alt={`${comment.userName || 'Anonymous'}'s avatar`}
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    </div>
                  </Link>
                </div>
                <div className="flex-1">
                  <div className="mb-2">
                    <Link 
                      href={`/user/${comment.userId}`}
                      className="text-orange-400 font-medium hover:text-orange-300 transition-colors"
                    >
                      {comment.userName || 'Anonymous'}
                    </Link>
                    <div className="flex items-center gap-1 mt-1">
                      <StarRating
                        rating={comment.rating}
                        size="sm"
                      />
                    </div>
                  </div>
                  <p className="text-gray-300">{comment.comment}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400">No comments yet</div>
          )}
        </div>
      </div>
    </div>
  );
}; 