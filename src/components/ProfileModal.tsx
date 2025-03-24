'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { useUser } from '@/context/UserContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername: string;
  currentAvatar?: string;
}

export function ProfileModal({ isOpen, onClose, currentUsername, currentAvatar }: ProfileModalProps) {
  const [username, setUsername] = useState(currentUsername);
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar || 'Avatar1.webp');
  const [isLoading, setIsLoading] = useState(false);
  const { updateUserProfile } = useUser();

  // Get all available avatars
  const avatars = Array.from({ length: 13 }, (_, i) => `Avatar${i + 1}.webp`);

  useEffect(() => {
    setUsername(currentUsername);
    setSelectedAvatar(currentAvatar || 'Avatar1.webp');
  }, [currentUsername, currentAvatar]);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await updateUserProfile(username, selectedAvatar);
      toast.success('Profile updated successfully');
      onClose();
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center">
      <div className="bg-gray-800 rounded-xl shadow-xl border border-orange-500/20 w-full max-w-md mx-4">
        <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">Edit Profile</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4">
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Enter your username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Avatar
            </label>
            <div className="grid grid-cols-4 gap-2">
              {avatars.map((avatar) => (
                <div
                  key={avatar}
                  className={`relative aspect-square cursor-pointer rounded-lg border-2 transition-all ${
                    selectedAvatar === avatar
                      ? 'border-orange-500'
                      : 'border-transparent hover:border-orange-500/50'
                  }`}
                  onClick={() => setSelectedAvatar(avatar)}
                >
                  <Image
                    src={`/avatars/${avatar}`}
                    alt={`Avatar ${avatar}`}
                    fill
                    sizes="(max-width: 768px) 80px, 100px"
                    className="rounded-lg object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 