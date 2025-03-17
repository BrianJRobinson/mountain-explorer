import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/auth-options';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    logger.info('Toggle completion request received', { session }, session?.user?.id, 'auth:session');

    if (!session?.user) {
      logger.warn('Unauthorized toggle attempt', {}, undefined, 'auth:unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mountainId, completed, userId } = await request.json();
    logger.info('Toggle request details', { mountainId, completed, userId }, userId, 'mountain:toggle');

    if (userId !== session.user.id) {
      logger.warn('User ID mismatch', { requestUserId: userId, sessionUserId: session.user.id }, session.user.id, 'auth:mismatch');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let result;
    if (completed) {
      result = await prisma.mountainCompletion.create({
        data: {
          userId,
          mountainId,
        },
      });
      logger.info('Mountain completion created', result, userId, 'mountain:completed');
    } else {
      result = await prisma.mountainCompletion.delete({
        where: {
          userId_mountainId: {
            userId,
            mountainId,
          },
        },
      });
      logger.info('Mountain completion deleted', result, userId, 'mountain:uncompleted');
    }

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Toggle completion error', { error }, undefined, 'mountain:error');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 