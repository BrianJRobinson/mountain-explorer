import prisma from '@/lib/prisma';

export type NotificationType = 'MOUNTAIN_COMPLETED' | 'FOLLOWED';

interface CreateNotificationParams {
  type: NotificationType;
  senderId: string;
  recipientId: string;
  mountainId?: number;
}

export async function createNotification({
  type,
  senderId,
  recipientId,
  mountainId
}: CreateNotificationParams) {
  if (senderId === recipientId) return null; // Don't create notifications for self-actions

  return prisma.notification.create({
    data: {
      type,
      senderId,
      recipientId,
      mountainId,
    }
  });
}

export async function createMountainCompletionNotifications(userId: string, mountainId: number) {
  // Get all followers of the user
  const followers = await prisma.follow.findMany({
    where: {
      followingId: userId
    },
    select: {
      followerId: true
    }
  });

  // Create notifications for all followers
  return Promise.all(
    followers.map(follower =>
      createNotification({
        type: 'MOUNTAIN_COMPLETED',
        senderId: userId,
        recipientId: follower.followerId,
        mountainId
      })
    )
  );
}

export async function createFollowNotification(followerId: string, followingId: string) {
  return createNotification({
    type: 'FOLLOWED',
    senderId: followerId,
    recipientId: followingId
  });
} 