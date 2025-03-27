import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Bell } from 'lucide-react';

interface Notification {
  id: string;
  type: 'MOUNTAIN_COMPLETED' | 'FOLLOWED';
  isRead: boolean;
  createdAt: string;
  sender: {
    name: string | null;
    avatar: string | null;
  };
  datasetId: number;  // 1 for mountains, 2 for walks, 99 for follows
  activityId?: number;
}

export function NotificationBell() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications');
        const data = await response.json();
        // Only keep unread notifications
        setNotifications(data.notifications.filter((n: Notification) => !n.isRead));
        setUnreadCount(data.unreadCount);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    if (session?.user) {
      fetchNotifications();
      // Refresh notifications every minute
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [session?.user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });

      // Mark as read and trigger animation
      setReadNotifications(prev => new Set([...prev, notificationId]));

      // Remove notification after animation completes
      setTimeout(() => {
        // Remove the notification from the list entirely
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));

        // Close panel if no more notifications
        if (notifications.length <= 1) {  // Using 1 because this notification is about to be removed
          setIsOpen(false);
        }
      }, 300); // Match this with the animation duration
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationText = (notification: Notification) => {
    if (notification.type === 'FOLLOWED') {
      return 'started following you';
    }
    
    switch (notification.datasetId) {
      case 1:
        return 'completed a mountain';
      case 2:
        return 'completed a walk';
      default:
        return 'performed an action';
    }
  };

  if (!session?.user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-800 rounded-full"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-orange-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-[-8rem] sm:right-0 mt-2 w-80 bg-gray-800 rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="py-1 max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400">
                No notifications
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 hover:bg-gray-700/50 cursor-pointer transition-all duration-300 ${
                    !notification.isRead ? 'bg-gray-700/30' : ''
                  } ${
                    readNotifications.has(notification.id)
                      ? 'opacity-0 -translate-x-full'
                      : 'opacity-100 translate-x-0'
                  }`}
                  onClick={() => !readNotifications.has(notification.id) && handleNotificationClick(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative flex-shrink-0 w-10 h-10">
                      <Image
                        src={`/avatars/${notification.sender.avatar === "default" ? 'Avatar1.webp' : notification.sender.avatar || 'Avatar1.webp'}`}
                        alt={`${notification.sender.name || 'User'}'s avatar`}
                        fill
                        className="rounded-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">
                        <span className="font-medium">
                          {notification.sender.name || 'Anonymous User'}
                        </span>{' '}
                        {getNotificationText(notification)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
} 