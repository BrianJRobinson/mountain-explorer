'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { ProfileModal } from './ProfileModal';

interface ProfileModalContextType {
  openProfileModal: () => void;
  closeProfileModal: () => void;
}

const ProfileModalContext = createContext<ProfileModalContextType | undefined>(undefined);

export function ProfileModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();

  const openProfileModal = () => setIsOpen(true);
  const closeProfileModal = () => setIsOpen(false);

  return (
    <ProfileModalContext.Provider value={{ openProfileModal, closeProfileModal }}>
      {children}
      <ProfileModal
        isOpen={isOpen}
        onClose={closeProfileModal}
        currentUsername={session?.user?.name || ''}
        currentAvatar={session?.user?.avatar || undefined}
      />
    </ProfileModalContext.Provider>
  );
}

export function useProfileModal() {
  const context = useContext(ProfileModalContext);
  if (context === undefined) {
    throw new Error('useProfileModal must be used within a ProfileModalProvider');
  }
  return context;
} 