import { NextRequest, NextResponse } from 'next/server';
import { getRateLimitCollection } from '@/lib/mongodb';

// Rate limit configurations per endpoint type
export const RATE_LIMITS = {
    // Authentication endpoints - strict limits
    auth: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 10, // 10 attempts per 15 minutes
    },
    // API endpoints - moderate limits
    api: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 60, // 60 requests per minute
    },
    // Heavy endpoints (AI, file uploads) - strict limits
    heavy: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 10, // 10 requests per minute
    },
    // Public endpoints - lenient limits
    public: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 100, // 100 requests per minute
    },
};

export type RateLimitType = keyof typeof RATE_LIMITS;

/**
 * Get client IP address from request
 */
export function getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
        return realIP;
    }

    return 'unknown';
}

/**
 * Check rate limit for a request
 */
export async function checkRateLimit(
    key: string,
    endpoint: string,
    limitType: RateLimitType = 'api'
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    const config = RATE_LIMITS[limitType];
    const now = new Date();
    const windowStart = new Date(now.getTime() - config.windowMs);

    try {
        const rateLimits = await getRateLimitCollection();

        const existing = await rateLimits.findOne({
            key,
            endpoint,
            windowStart: { $gte: windowStart },
        });

        if (!existing) {
            await rateLimits.insertOne({
                key,
                endpoint,
                count: 1,
                windowStart: now,
                expiresAt: new Date(now.getTime() + config.windowMs),
            });

            return {
                allowed: true,
                remaining: config.maxRequests - 1,
                resetAt: new Date(now.getTime() + config.windowMs),
            };
        }

        if (existing.count >= config.maxRequests) {
            return {
                allowed: false,
                remaining: 0,
                resetAt: existing.expiresAt,
            };
        }

        await rateLimits.updateOne(
            { _id: existing._id },
            { $inc: { count: 1 } }
        );

        return {
            allowed: true,
            remaining: config.maxRequests - existing.count - 1,
            resetAt: existing.expiresAt,
        };
    } catch (error) {
        // FAIL CLOSED: On DB error, deny the request for safety
        console.error('Rate limit check error:', error);
        return {
            allowed: false,
            remaining: 0,
            resetAt: new Date(now.getTime() + config.windowMs),
        };
    }
}

/**
 * Rate limit middleware helper
 */
export async function rateLimitMiddleware(
    request: NextRequest,
    limitType: RateLimitType = 'api'
): Promise<NextResponse | null> {
    const ip = getClientIP(request);
    const endpoint = request.nextUrl.pathname;

    const result = await checkRateLimit(ip, endpoint, limitType);

    if (!result.allowed) {
        return NextResponse.json(
            {
                error: 'Çok fazla istek gönderdiniz. Lütfen bekleyin.',
                retryAfter: Math.ceil((result.resetAt.getTime() - Date.now()) / 1000),
            },
            {
                status: 429,
                headers: {
                    'Retry-After': String(Math.ceil((result.resetAt.getTime() - Date.now()) / 1000)),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': result.resetAt.toISOString(),
                },
            }
        );
    }

    return null;
}

/**
 * Cleanup expired rate limit records
 */
export async function cleanupExpiredRateLimits(): Promise<number> {
    const rateLimits = await getRateLimitCollection();
    const result = await rateLimits.deleteMany({
        expiresAt: { $lt: new Date() },
    });
    return result.deletedCount;
}
