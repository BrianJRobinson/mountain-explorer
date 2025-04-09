import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sitesId = searchParams.get('siteId');
    console.log('Params: ' + searchParams);
    if (!sitesId) {
      return NextResponse.json(
        { error: 'Site ID is required' },
        { status: 400 }
      );
    }

    // Fetch the 5 most recent comments for this mountain
    const comments = await prisma.siteRating.findMany({
      where: {
        siteId: parseInt(sitesId),
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
    console.error('Error fetching sites comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
} 