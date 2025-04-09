import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const count = await prisma.siteRating.count({
      where: {
        siteId: parseInt(siteId),
        comment: {
          not: null
        }
      }
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching comment count:', error);
    return NextResponse.json({ error: 'Failed to fetch comment count' }, { status: 500 });
  }
} 