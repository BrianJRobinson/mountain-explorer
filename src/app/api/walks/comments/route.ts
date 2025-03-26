import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/auth-options';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const { searchParams } = new URL(request.url);
    const walkName = searchParams.get('walkName');

    if (!walkName) {
      return NextResponse.json(
        { error: 'Walk name is required' },
        { status: 400 }
      );
    }

    // Fetch the 5 most recent comments for this walk
    const comments = await prisma.walkRating.findMany({
      where: {
        walkName: walkName,
        comment: {
          not: null
        }
      },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    // Transform the data to match our existing comment structure
    const formattedComments = comments.map(comment => ({
      userId: comment.user.id,
      userName: comment.user.name,
      userAvatar: comment.user.avatar,
      rating: comment.rating,
      comment: comment.comment,
      createdAt: comment.createdAt.toISOString()
    }));

    return NextResponse.json(formattedComments);
  } catch (error) {
    console.error('Error fetching walk comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
} 