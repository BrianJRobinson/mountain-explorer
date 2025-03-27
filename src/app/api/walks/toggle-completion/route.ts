import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { createWalkCompletionNotifications } from '@/lib/notifications';

export async function POST(request: Request) {
  try {
    console.log('[WalkToggle] Request received');
    const session = await getServerSession(authOptions);
    logger.info('Toggle completion request received', { session }, session?.user?.id, 'auth:session');
    console.log('[WalkToggle] Session:', { 
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      userId: session?.user?.id 
    });
    if (!session?.user) {
      logger.warn('Unauthorized toggle attempt', {}, undefined, 'auth:unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { walkId, completed, userId } = await request.json();
    logger.info('Toggle request details', { walkId, completed, userId }, userId, 'walk:toggle');

    if (!walkId || typeof completed !== 'boolean' || !userId) {
      logger.warn('Invalid request parameters', { walkId, completed, userId }, userId, 'walk:invalid');
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
    }

    if (userId !== session.user.id) {
      logger.warn('User ID mismatch', { requestUserId: userId, sessionUserId: session.user.id }, session.user.id, 'auth:mismatch');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let result;
    try {
      console.log("Completed value is " + completed);
      if (completed) {
        result = await prisma.walkCompletion.create({
          data: {
            userId,
            walkId,
          },
        });
        logger.info('Walk completion created', result, userId, 'walk:completed');

        // Create notifications for followers
        await createWalkCompletionNotifications(userId, walkId);
      } else {
        result = await prisma.walkCompletion.delete({
          where: {
            userId_walkId: {
              userId,
              walkId,
            },
          },
        });
        logger.info('Walk completion deleted', result, userId, 'walk:uncompleted');
      }
    } catch (dbError) {
      logger.error('Database operation failed', { 
        error: dbError, 
        operation: completed ? 'create' : 'delete',
        walkId,
        userId
      }, userId, 'walk:db_error');
      throw dbError;
    }

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Toggle completion error', { 
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      errorName: error instanceof Error ? error.name : undefined
    }, undefined, 'mountain:error');
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 