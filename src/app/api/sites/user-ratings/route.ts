import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's ratings
    const userRatings = await prisma.siteRating.findMany({
      where: {
        userId: session.user.id
      },
      select: {
        siteId: true,
        rating: true,
        comment: true
      }
    });

    // For each site that the user has rated, get the average rating and total count
    const ratingsWithStats = await Promise.all(
      userRatings.map(async (rating) => {
        const stats = await prisma.siteRating.aggregate({
          where: {
            siteId: rating.siteId
          },
          _avg: {
            rating: true
          },
          _count: {
            rating: true
          }
        });

        return {
          siteId: rating.siteId,
          rating: rating.rating,
          comment: rating.comment,
          averageRating: stats._avg.rating ?? rating.rating,
          totalRatings: stats._count.rating
        };
      })
    );

    return NextResponse.json(ratingsWithStats);
  } catch (error) {
    console.error('Error fetching user ratings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 