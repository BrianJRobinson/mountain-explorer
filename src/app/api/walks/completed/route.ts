import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/auth-options';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        walkProgress: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const completedWalks = user.walkProgress.reduce((acc, walk) => {
      acc[walk.walkName] = true;
      return acc;
    }, {} as Record<string, boolean>);

    return NextResponse.json(completedWalks);
  } catch (error) {
    console.error('Error fetching completed walks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch completed walks' },
      { status: 500 }
    );
  }
} 