import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/auth-options';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ratings = await prisma.walkRating.groupBy({
      by: ['walkId'],
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    });

    const formattedRatings = ratings.map(rating => ({
      walkId: rating.walkId,
      averageRating: rating._avg.rating || 0,
      totalRatings: rating._count.rating,
    }));

    return NextResponse.json(formattedRatings);
  } catch (error) {
    console.error('Error fetching walk ratings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 