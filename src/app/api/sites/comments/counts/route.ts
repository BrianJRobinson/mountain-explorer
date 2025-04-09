import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Get all sites that have comments
    const sitesWithComments = await prisma.siteRating.groupBy({
      by: ['siteId'],
      where: {
        comment: {
          not: null
        }
      },
      _count: {
        _all: true
      }
    });

    // Convert to a map of siteId -> comment count
    const commentCounts = sitesWithComments.reduce((acc, curr) => {
      acc[curr.siteId] = curr._count._all;
      return acc;
    }, {} as Record<number, number>);

    return NextResponse.json(commentCounts);
  } catch (error) {
    console.error('Error fetching comment counts:', error);
    return NextResponse.json({ error: 'Failed to fetch comment counts' }, { status: 500 });
  }
} 