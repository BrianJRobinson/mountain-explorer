import prisma from '@/lib/prisma';

export type NotificationType = 'MOUNTAIN_COMPLETED' | 'WALK_COMPLETED' |'FOLLOWED';

interface CreateNotificationParams {
  type: NotificationType;
  senderId: string;
  recipientId: string;
  datasetId: number;  // 1 for mountains, 2 for walks, 99 for follows
  activityId?: number;
}

export async function createNotification({
  type,
  senderId,
  recipientId,
  datasetId,
  activityId
}: CreateNotificationParams) {
  if (senderId === recipientId) return null; // Don't create notifications for self-actions

  return prisma.notification.create({
    data: {
      type,
      senderId,
      recipientId,
      datasetId,
      activityId,
      isRead: false
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
        datasetId: 1, // 1 for mountains
        activityId: mountainId
      })
    )
  );
}

export async function createWalkCompletionNotifications(userId: string, walkId: number) {
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
        type: 'WALK_COMPLETED',  // We'll keep using the same type for now
        senderId: userId,
        recipientId: follower.followerId,
        datasetId: 2,  // 2 for walks
        activityId: walkId
      })
    )
  );
}

export async function createFollowNotification(followerId: string, followingId: string) {
  return createNotification({
    type: 'FOLLOWED',
    senderId: followerId,
    recipientId: followingId,
    datasetId: 99  // 99 for follows
  });
} 