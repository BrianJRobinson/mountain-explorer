import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyCaptcha } from '@/lib/captcha';
import { sendPasswordResetEmail } from '@/lib/email';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { email, recaptchaToken } = await request.json();

    // Verify reCAPTCHA
    const isValidCaptcha = await verifyCaptcha(recaptchaToken);
    if (!isValidCaptcha) {
      return NextResponse.json(
        { error: 'Invalid reCAPTCHA token' },
        { status: 400 }
      );
    }

    // Find user first
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal that the user doesn't exist
      logger.info('Password reset requested for non-existent email:', email);
      return NextResponse.json({ success: true });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now

    try {
      // Update user with reset token
      await prisma.user.update({
        where: { id: user.id }, // Use ID instead of email for more reliable updates
        data: {
          resetToken,
          resetTokenExpires,
        },
      });

      // Send reset email
      await sendPasswordResetEmail(email, resetToken);
      logger.info('Password reset email sent:', { email });
    } catch (updateError) {
      logger.error('Error updating user with reset token:', updateError);
      throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
} 