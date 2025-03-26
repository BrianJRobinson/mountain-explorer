import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/auth-options';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    console.log('API Route - Session:', session);
    console.log('API Route - User:', session?.user);

    if (!session?.user?.id) {
      console.log('API Route - No user ID in session');
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    console.log('API Route - Fetching completed walks for user:', session.user.id);

    const completedWalks = await prisma.walkCompletion.findMany({
      where: {
        userId: session.user.id,
      },
    });

    console.log('API Route - Found completed walks:', completedWalks);

    return new NextResponse(JSON.stringify(completedWalks), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('API Route - Error fetching completed walks:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
} 