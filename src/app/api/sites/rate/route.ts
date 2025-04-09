import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import prisma from '@/lib/prisma';
import { createSiteCompletionNotifications } from '@/lib/notifications';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { siteId, rating, comment } = await request.json();

    if (!siteId || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Upsert the rating (create or update)
      const siteRating = await tx.siteRating.upsert({
        where: {
          userId_siteId: {
            userId: session.user.id,
            siteId: siteId,
          },
        },
        update: {
          rating,
          comment,
        },
        create: {
          userId: session.user.id,
          siteId: siteId,
          rating,
          comment,
        },
      });

      // Always set completion to true when rating
      await tx.siteCompletion.upsert({
        where: {
          userId_siteId: {
            userId: session.user.id,
            siteId: siteId,
          },
        },
        update: {},
        create: {
          userId: session.user.id,
          siteId: siteId,
        },
      });

      // Get the updated average rating
      const ratings = await tx.siteRating.aggregate({
        where: {
          siteId: siteId,
        },
        _avg: {
          rating: true,
        },
        _count: {
          _all: true,
        },
      });

      return {
        ...siteRating,
        averageRating: ratings._avg.rating || rating,
        totalRatings: ratings._count._all || 1,
        userRating: rating
      };
    });

    // Create notification after the transaction succeeds
    await createSiteCompletionNotifications(session.user.id, siteId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in rating site:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 