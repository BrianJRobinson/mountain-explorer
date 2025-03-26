import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/auth-options';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { walkName, rating, comment } = await request.json();

    if (!walkName || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Invalid walk name or rating' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Upsert the rating
    const updatedRating = await prisma.walkRating.upsert({
      where: {
        userId_walkName: {
          userId: user.id,
          walkName: walkName,
        },
      },
      update: {
        rating,
        comment,
      },
      create: {
        userId: user.id,
        walkName,
        rating,
        comment,
      },
    });

    return NextResponse.json(updatedRating);
  } catch (error) {
    console.error('Error rating walk:', error);
    return NextResponse.json(
      { error: 'Failed to rate walk' },
      { status: 500 }
    );
  }
} 