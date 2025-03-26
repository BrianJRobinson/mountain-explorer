import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { mountainId, rating, comment } = await request.json();

    if (!mountainId || !rating || rating < 0.5 || rating > 5) {
      return NextResponse.json(
        { error: 'Invalid rating data' },
        { status: 400 }
      );
    }

    // Use a transaction to ensure both operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // Upsert the rating (create or update)
      const mountainRating = await tx.mountainRating.upsert({
        where: {
          userId_mountainId: {
            userId: session.user.id,
            mountainId: mountainId,
          },
        },
        update: {
          rating,
          comment,
        },
        create: {
          userId: session.user.id,
          mountainId: mountainId,
          rating,
          comment,
        },
      });

      // Always set completion to true when rating
      await tx.mountainCompletion.upsert({
        where: {
          userId_mountainId: {
            userId: session.user.id,
            mountainId: mountainId,
          },
        },
        update: {},
        create: {
          userId: session.user.id,
          mountainId: mountainId,
        },
      });

      // Get the updated average rating
      const ratings = await tx.mountainRating.aggregate({
        where: {
          mountainId: mountainId,
        },
        _avg: {
          rating: true,
        },
        _count: {
          rating: true,
        },
      });

      return {
        ...mountainRating,
        averageRating: ratings._avg.rating || rating,
        totalRatings: ratings._count.rating || 1,
        userRating: rating
      };
    });

    console.log('API: Returning rating result:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in rating mountain:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 