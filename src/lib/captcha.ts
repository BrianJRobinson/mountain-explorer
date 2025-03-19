import { logger } from './logger';

export async function verifyCaptcha(token: string): Promise<boolean> {
  // Bypass CAPTCHA verification in development
  if (process.env.NODE_ENV === 'development') {
    logger.info('Development environment: CAPTCHA verification bypassed');
    return true;
  }

  if (!process.env.RECAPTCHA_SECRET_KEY) {
    logger.warn('RECAPTCHA_SECRET_KEY not found, verification disabled');
    return true;
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
    });

    const data = await response.json();

    // For v3, we also check the score
    if (data.success && data.score >= 0.5) {
      return true;
    }

    logger.warn('reCAPTCHA verification failed:', {
      success: data.success,
      score: data.score,
      action: data.action,
    });

    return false;
  } catch (error) {
    logger.error('Error verifying CAPTCHA:', error);
    return false;
  }
} 