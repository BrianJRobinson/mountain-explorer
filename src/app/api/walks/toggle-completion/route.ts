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

    const { walkName } = await request.json();
    if (!walkName) {
      return NextResponse.json({ error: 'Walk name is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if the walk is already completed
    const existingCompletion = await prisma.walkCompletion.findUnique({
      where: {
        userId_walkName: {
          userId: user.id,
          walkName: walkName,
        },
      },
    });

    if (existingCompletion) {
      // If completed, remove the completion
      await prisma.walkCompletion.delete({
        where: {
          userId_walkName: {
            userId: user.id,
            walkName: walkName,
          },
        },
      });
      return NextResponse.json({ completed: false });
    } else {
      // If not completed, add the completion
      await prisma.walkCompletion.create({
        data: {
          userId: user.id,
          walkName: walkName,
        },
      });
      return NextResponse.json({ completed: true });
    }
  } catch (error) {
    console.error('Error toggling walk completion:', error);
    return NextResponse.json(
      { error: 'Failed to toggle walk completion' },
      { status: 500 }
    );
  }
} 