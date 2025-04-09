import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Get all walks that have comments
    const walksWithComments = await prisma.walkRating.groupBy({
      by: ['walkId'],
      where: {
        comment: {
          not: null
        }
      },
      _count: {
        _all: true
      }
    });

    // Convert to a map of walkId -> comment count
    const commentCounts = walksWithComments.reduce((acc, curr) => {
      acc[curr.walkId] = curr._count._all;
      return acc;
    }, {} as Record<number, number>);

    return NextResponse.json(commentCounts);
  } catch (error) {
    console.error('Error fetching comment counts:', error);
    return NextResponse.json({ error: 'Failed to fetch comment counts' }, { status: 500 });
  }
} 