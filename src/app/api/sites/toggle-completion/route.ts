import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { createSiteCompletionNotifications } from '@/lib/notifications';

export async function POST(request: Request) {
  try {
    console.log('[SiteToggle] Request received');
    const session = await getServerSession(authOptions);
    logger.info('Toggle completion request received', { session }, session?.user?.id, 'auth:session');

    if (!session?.user) {
      logger.warn('Unauthorized toggle attempt', {}, undefined, 'auth:unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { siteId, completed, userId } = await request.json();
    logger.info('Toggle request details', { siteId, completed, userId }, userId, 'sites:toggle');

    if (!siteId || typeof completed !== 'boolean' || !userId) {
      logger.warn('Invalid request parameters', { siteId, completed, userId }, userId, 'sites:invalid');
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
    }

    if (userId !== session.user.id) {
      logger.warn('User ID mismatch', { requestUserId: userId, sessionUserId: session.user.id }, session.user.id, 'auth:mismatch');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let result;
    try {
      if (completed) {
        result = await prisma.siteCompletion.create({
          data: {
            userId,
            siteId,
          },
        });
        logger.info('Site completion created', result, userId, 'sites:completed');

        // Create notifications for followers
        await createSiteCompletionNotifications(userId, siteId);
      } else {
        result = await prisma.siteCompletion.delete({
          where: {
            userId_siteId: {
              userId,
              siteId,
            },
          },
        });
        logger.info('Site completion deleted', result, userId, 'sites:uncompleted');
      }
    } catch (dbError) {
      logger.error('Database operation failed', { 
        error: dbError, 
        operation: completed ? 'create' : 'delete',
        siteId,
        userId
      }, userId, 'sites:db_error');
      throw dbError;
    }

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Toggle completion error', { 
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      errorName: error instanceof Error ? error.name : undefined
    }, undefined, 'sites:error');
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 