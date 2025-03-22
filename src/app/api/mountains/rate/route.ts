import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { mountainId, rating, comment } = await request.json();

    if (!mountainId || !rating || rating < 0.5 || rating > 5) {
      return NextResponse.json(
        { error: 'Invalid rating data' },
        { status: 400 }
      );
    }

    // Upsert the rating (create or update)
    const mountainRating = await prisma.mountainRating.upsert({
      where: {
        userId_mountainId: {
          userId: session.user.id,
          mountainId: mountainId,
        },
      },
      update: {
        rating,
        comment,
      },
      create: {
        userId: session.user.id,
        mountainId: mountainId,
        rating,
        comment,
      },
    });

    return NextResponse.json(mountainRating);
  } catch (error) {
    console.error('Error in rating mountain:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 