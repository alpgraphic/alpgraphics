import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredSessions } from '@/lib/auth/session';
import { cleanupExpiredRateLimits } from '@/lib/security/rateLimit';

/**
 * POST /api/cron/cleanup - Clean up expired sessions and rate limits
 * 
 * Protected by CRON_SECRET env variable.
 * Can be called by Vercel Cron, external cron service, or manually.
 * 
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup",
 *     "schedule": "0 every-6-hours"
 *   }]
 * }
 */
export async function POST(request: NextRequest) {
    try {
        // Verify cron secret
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Cleanup expired sessions
        const deletedSessions = await cleanupExpiredSessions();

        // Cleanup expired rate limits
        const deletedRateLimits = await cleanupExpiredRateLimits();

        return NextResponse.json({
            success: true,
            cleaned: {
                sessions: deletedSessions,
                rateLimits: deletedRateLimits,
            },
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Cleanup error:', error);
        return NextResponse.json(
            { error: 'Cleanup failed' },
            { status: 500 }
        );
    }
}

// Also support GET for Vercel Cron (which uses GET by default)
export async function GET(request: NextRequest) {
    return POST(request);
}
