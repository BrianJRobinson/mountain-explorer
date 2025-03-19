import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyCaptcha } from '@/lib/captcha';
import { logger } from '@/lib/logger';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { token, password, recaptchaToken } = await request.json();

    // Verify reCAPTCHA
    const isValidCaptcha = await verifyCaptcha(recaptchaToken);
    if (!isValidCaptcha) {
      return NextResponse.json(
        { error: 'Invalid reCAPTCHA token' },
        { status: 400 }
      );
    }

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user's password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
} 