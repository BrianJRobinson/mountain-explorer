import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { verifyCaptcha } from '@/lib/captcha';
import { sendVerificationEmail } from '@/lib/email';
import { randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const { name, email, password, recaptchaToken } = await request.json();

    if (!name || !email || !password || !recaptchaToken) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Verify CAPTCHA
    const isValidCaptcha = await verifyCaptcha(recaptchaToken);
    if (!isValidCaptcha) {
      return NextResponse.json(
        { error: 'Invalid CAPTCHA' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Generate verification token
    const verificationToken = randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user
    const userData: Prisma.UserCreateInput = {
      name,
      email,
      password: hashedPassword,
      verificationToken,
      verificationTokenExpires,
    };

    const user = await prisma.user.create({
      data: userData
    });

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    logger.info('User registered successfully:', { userId: user.id, email: user.email });

    return NextResponse.json({ 
      success: true,
      message: 'Registration successful! Please check your email to verify your account.'
    });
  } catch (error) {
    logger.error('Error in registration:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
} 