import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Redis client with error handling
let redis: Redis | null = null;

try {
  if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL,
      token: process.env.UPSTASH_REDIS_TOKEN,
    });
  } else {
    console.warn('Redis credentials not found, rate limiting will be disabled');
  }
} catch (error) {
  console.error('Failed to initialize Redis client:', error);
}

export interface RateLimitConfig {
  interval: number; // Time window in seconds
  limit: number;    // Maximum number of requests in the time window
}

export async function rateLimit(
  ip: string,
  key: string,
  config: RateLimitConfig
): Promise<{ success: boolean; remaining: number; reset: number }> {
  // If Redis is not initialized, allow the request
  if (!redis) {
    return { success: true, remaining: config.limit, reset: 0 };
  }

  const now = Math.floor(Date.now() / 1000);
  const windowKey = `ratelimit:${ip}:${key}:${Math.floor(now / config.interval)}`;

  try {
    const pipeline = redis.pipeline();
    pipeline.incr(windowKey);
    pipeline.expire(windowKey, config.interval);
    
    const results = await pipeline.exec();
    const count = results?.[0] as number || 0;

    const remaining = Math.max(0, config.limit - count);
    const reset = Math.ceil(now / config.interval) * config.interval;

    return {
      success: remaining > 0,
      remaining,
      reset,
    };
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Fail open if Redis operation fails
    return { success: true, remaining: 1, reset: now + config.interval };
  }
}

// Middleware helper for rate limiting
export async function rateLimitMiddleware(
  request: Request,
  key: string,
  config: RateLimitConfig
) {
  try {
    // Get IP from headers or fallback
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 
               request.headers.get('x-real-ip') || 'unknown';

    const result = await rateLimit(ip, key, config);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          retryAfter: result.reset - Math.floor(Date.now() / 1000),
        },
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(result.reset - Math.floor(Date.now() / 1000)),
          },
        }
      );
    }

    return null;
  } catch (error) {
    console.error('Rate limit middleware error:', error);
    // Fail open if there's an error
    return null;
  }
} 