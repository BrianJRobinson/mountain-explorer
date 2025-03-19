import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Find user by verification token with explicit field selection
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token
      },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        verificationToken: true,
        verificationTokenExpires: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
      return NextResponse.json(
        { error: 'Verification token has expired' },
        { status: 400 }
      );
    }

    // Update user's email verification status
    const updateData: Prisma.UserUpdateInput = {
      emailVerified: new Date(),
      verificationToken: null,
      verificationTokenExpires: null
    };

    await prisma.user.update({
      where: { 
        id: user.id 
      },
      data: updateData
    });

    logger.info('Email verified successfully:', { userId: user.id, email: user.email });

    return NextResponse.json({ 
      success: true,
      message: 'Email verified successfully! You can now log in.'
    });
  } catch (error) {
    logger.error('Error in email verification:', error);
    return NextResponse.json(
      { error: 'An error occurred during email verification' },
      { status: 500 }
    );
  }
} 