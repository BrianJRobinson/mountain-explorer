import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient, Prisma } from '@prisma/client';
import { authOptions } from '../../auth/auth-options';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session in toggle API:', session);

    if (!session?.user?.id) {
      console.log('No user ID in session');
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const { mountainId, completed } = await request.json();
    console.log('Toggle request received:', { mountainId, completed, userId: session.user.id });

    if (typeof mountainId !== 'number') {
      console.log('Invalid mountain ID type:', typeof mountainId);
      return new NextResponse(JSON.stringify({ error: 'Invalid mountain ID' }), {
        status: 400,
      });
    }

    if (completed) {
      try {
        const completion = await prisma.mountainCompletion.create({
          data: {
            userId: session.user.id,
            mountainId,
            completedAt: new Date(),
          },
        });
        console.log('Created completion:', completion);
        return new NextResponse(JSON.stringify({ success: true, completion }), {
          status: 200,
        });
      } catch (error) {
        console.error('Error creating completion:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2002') {
            return new NextResponse(JSON.stringify({ error: 'Mountain already completed' }), {
              status: 409,
            });
          }
        }
        throw error;
      }
    } else {
      try {
        const deletion = await prisma.mountainCompletion.delete({
          where: {
            userId_mountainId: {
              userId: session.user.id,
              mountainId,
            },
          },
        });
        console.log('Deleted completion:', deletion);
        return new NextResponse(JSON.stringify({ success: true, deletion }), {
          status: 200,
        });
      } catch (error) {
        console.error('Error deleting completion:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2025') {
            return new NextResponse(JSON.stringify({ error: 'Mountain completion not found' }), {
              status: 404,
            });
          }
        }
        throw error;
      }
    }
  } catch (error) {
    console.error('Error in toggle completion:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  } finally {
    await prisma.$disconnect();
  }
} 