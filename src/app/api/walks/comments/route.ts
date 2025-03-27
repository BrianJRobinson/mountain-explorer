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
    const walkId = searchParams.get('walkId');

    if (!walkId) {
      return NextResponse.json(
        { error: 'Walk ID is required' },
        { status: 400 }
      );
    }

    const comments = await prisma.walkRating.findMany({
      where: {
        walkId: parseInt(walkId),
        comment: {
          not: null
        }
      },
      select: {
        walkId: true,
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
      }
    });

    // Transform the data to match our expected format
    const formattedComments = comments.map(comment => ({
      walkId: comment.walkId,
      userId: comment.user.id,
      userName: comment.user.name,
      userAvatar: comment.user.avatar,
      rating: comment.rating,
      comment: comment.comment,
      createdAt: comment.createdAt.toISOString()
    }));

    return NextResponse.json(formattedComments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 