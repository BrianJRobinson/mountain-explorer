import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/notifications
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Clean up old notifications (older than 14 days)
    await prisma.notification.deleteMany({
      where: {
        recipientId: session.user.id,
        createdAt: {
          lt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
        }
      }
    });

    // Get current notifications
    const notifications = await prisma.notification.findMany({
      where: {
        recipientId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        sender: {
          select: {
            name: true,
            avatar: true
          }
        }
      }
    });

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        recipientId: session.user.id,
        isRead: false
      }
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// PUT /api/notifications
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationIds } = await request.json();

    if (!Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: 'Invalid notification IDs' },
        { status: 400 }
      );
    }

    // Mark notifications as read
    await prisma.notification.updateMany({
      where: {
        id: {
          in: notificationIds
        },
        recipientId: session.user.id // Security: ensure user owns these notifications
      },
      data: {
        isRead: true
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
} 