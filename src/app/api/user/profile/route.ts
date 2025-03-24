import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

interface UpdateUserData {
  name: string;
  avatar?: string;
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { name, avatar } = body;

    if (!name || typeof name !== 'string' || name.length < 1) {
      return new NextResponse('Invalid username', { status: 400 });
    }

    const updateData: UpdateUserData = { name };
    
    if (avatar) {
      updateData.avatar = avatar;
    }

    const updatedUser = await prisma.user.update({
      where: {
        email: session.user.email,
      },
      data: updateData,
    });

    logger.info('User profile updated:', { 
      userId: session.user.email, 
      name,
      avatar: avatar || 'unchanged'
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    logger.error('Error updating user profile:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 