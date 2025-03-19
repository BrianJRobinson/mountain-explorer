import { Resend } from 'resend';
import { logger } from './logger';

const resend = new Resend(process.env.RESEND_API_KEY);

const isDevelopment = process.env.NODE_ENV === 'development';
const fromEmail = isDevelopment ? 'onboarding@resend.dev' : 'noreply@mountain-explorer.fyi';

export async function sendVerificationEmail(email: string, token: string) {
  try {
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: isDevelopment ? 'test@resend.dev' : email, // Use test email in development
      subject: 'Verify your Mountain Explorer account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #f97316;">Welcome to Mountain Explorer!</h1>
          <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Verify Email
            </a>
          </div>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account with Mountain Explorer, you can safely ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      logger.error('Error sending verification email:', error);
      throw error;
    }

    logger.info('Verification email sent successfully', { email: isDevelopment ? 'test@resend.dev' : email });
    return data;
  } catch (error) {
    logger.error('Error sending verification email:', error);
    throw error;
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  try {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: isDevelopment ? 'test@resend.dev' : email, // Use test email in development
      subject: 'Reset your Mountain Explorer password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #f97316;">Password Reset Request</h1>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="color: #666; word-break: break-all;">${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      logger.error('Error sending password reset email:', error);
      throw error;
    }

    logger.info('Password reset email sent successfully', { email: isDevelopment ? 'test@resend.dev' : email });
    return data;
  } catch (error) {
    logger.error('Error sending password reset email:', error);
    throw error;
  }
} 