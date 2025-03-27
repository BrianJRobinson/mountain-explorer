import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import prisma from '@/lib/prisma';
import { createWalkCompletionNotifications } from '@/lib/notifications';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { walkId, rating, comment } = await request.json();

    if (!walkId || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Upsert the rating (create or update)
      const walkRating = await tx.walkRating.upsert({
        where: {
          userId_walkId: {
            userId: session.user.id,
            walkId: walkId,
          },
        },
        update: {
          rating,
          comment,
        },
        create: {
          userId: session.user.id,
          walkId: walkId,
          rating,
          comment,
        },
      });

      // Always set completion to true when rating
      await tx.walkCompletion.upsert({
        where: {
          userId_walkId: {
            userId: session.user.id,
            walkId: walkId,
          },
        },
        update: {},
        create: {
          userId: session.user.id,
          walkId: walkId,
        },
      });

      // Get the updated average rating
      const ratings = await tx.walkRating.aggregate({
        where: {
          walkId: walkId,
        },
        _avg: {
          rating: true,
        },
        _count: {
          _all: true,
        },
      });

      return {
        ...walkRating,
        averageRating: ratings._avg.rating || rating,
        totalRatings: ratings._count._all || 1,
        userRating: rating
      };
    });

    // Create notification after the transaction succeeds
    await createWalkCompletionNotifications(session.user.id, walkId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in rating walk:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 