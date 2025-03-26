import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mountainId = searchParams.get('mountainId');

    if (!mountainId) {
      return NextResponse.json({ error: 'Mountain ID is required' }, { status: 400 });
    }

    const count = await prisma.mountainRating.count({
      where: {
        mountainId: mountainId,
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