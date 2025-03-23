import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/auth-options';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { avatar } = await request.json();

    if (!avatar) {
      return NextResponse.json(
        { error: 'Avatar is required' },
        { status: 400 }
      );
    }

    // Update user's avatar
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { avatar },
    });

    logger.info('User avatar updated:', { 
      userId: session.user.id, 
      avatar: avatar 
    });

    return NextResponse.json({ 
      success: true,
      avatar: updatedUser.avatar
    });
  } catch (error) {
    logger.error('Error updating user avatar:', error);
    return NextResponse.json(
      { error: 'Failed to update avatar' },
      { status: 500 }
    );
  }
} 