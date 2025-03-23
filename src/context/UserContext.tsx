'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { ProfileModal } from '@/components/ProfileModal';

interface UserContextType {
  userName: string;
  userAvatar: string | null;
  isLoading: boolean;
  openProfileModal: () => void;
  closeProfileModal: () => void;
  updateUserProfile: (name: string, avatar: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [userName, setUserName] = useState<string>('');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    if (status === 'loading') {
      setIsLoading(true);
      return;
    }

    if (session?.user) {
      setUserName(session.user.name || '');
      setUserAvatar(session.user.avatar || 'Avatar1.webp');
    }
    
    setIsLoading(false);
  }, [session, status]);

  const updateUserProfile = async (name: string, avatar: string) => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          avatar,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedUser = await response.json();
      setUserName(updatedUser.name);
      setUserAvatar(updatedUser.avatar);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  return (
    <UserContext.Provider 
      value={{ 
        userName, 
        userAvatar, 
        isLoading, 
        openProfileModal: () => setIsProfileModalOpen(true),
        closeProfileModal: () => setIsProfileModalOpen(false),
        updateUserProfile 
      }}
    >
      {children}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUsername={userName}
        currentAvatar={userAvatar || undefined}
      />
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
} 