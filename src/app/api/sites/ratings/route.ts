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

    // Get all mountain ratings with their averages
    const siteRatings = await prisma.siteRating.groupBy({
      by: ['siteId'],
      _sum: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    });

    // Transform the data into a more usable format
    const ratings = siteRatings.map(rating => ({
      siteId: rating.siteId,
      averageRating: rating._sum.rating ? rating._sum.rating / rating._count.rating : 0,
      totalRatings: rating._count.rating,
    }));

    return NextResponse.json(ratings);
  } catch (error) {
    console.error('Error fetching sites ratings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 