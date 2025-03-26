import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const walkName = searchParams.get('walkName');

    if (!walkName) {
      return NextResponse.json({ error: 'Walk name is required' }, { status: 400 });
    }

    const count = await prisma.walkRating.count({
      where: {
        walkName: walkName,
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