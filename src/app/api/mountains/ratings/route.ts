import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Get all mountain ratings with their averages
    const mountainRatings = await prisma.mountainRating.groupBy({
      by: ['mountainId'],
      _sum: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    });

    // Transform the data into a more usable format
    const ratings = mountainRatings.map(rating => ({
      mountainId: rating.mountainId,
      averageRating: rating._sum.rating ? rating._sum.rating / rating._count.rating : 0,
      totalRatings: rating._count.rating,
    }));

    return NextResponse.json(ratings);
  } catch (error) {
    console.error('Error fetching mountain ratings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 