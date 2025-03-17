import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    console.log('About to execute user count query...');
    const userCount = await prisma.user.count();
    console.log('Query completed. User count:', userCount);
    
    // Let's also try a more complex query
    console.log('About to fetch all mountain completions...');
    const completions = await prisma.mountainCompletion.findMany({
      include: {
        user: true
      }
    });
    console.log('Completions query finished. Found:', completions.length, 'completions');
    
    return NextResponse.json({ 
      status: 'success', 
      message: 'Database connection successful',
      userCount,
      completionsCount: completions.length
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Database connection failed', 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 