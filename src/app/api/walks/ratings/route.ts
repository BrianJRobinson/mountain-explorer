import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/auth-options';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const session = await getServerSession(authOptions);
    const isAuthenticated = !!session?.user?.email;

    // Get all ratings grouped by walk
    const ratings = await prisma.walkRating.groupBy({
      by: ['walkName'],
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    });

    // If userId is provided, get that user's ratings
    const userRatings = userId
      ? await prisma.walkRating.findMany({
          where: {
            user: {
              id: userId,
            },
          },
          select: {
            walkName: true,
            rating: true,
            comment: true,
          },
        })
      : [];

    // Format the response
    const formattedRatings = ratings.reduce((acc, walk) => {
      acc[walk.walkName] = {
        rating: walk._avg.rating || 0,
        count: walk._count.rating,
        userRating: userRatings.find((r) => r.walkName === walk.walkName),
      };
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json(formattedRatings);
  } catch (error) {
    console.error('Error fetching walk ratings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch walk ratings' },
      { status: 500 }
    );
  }
} 