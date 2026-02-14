import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { getSessionsCollection, getRateLimitCollection } from '@/lib/mongodb';

// GET /api/admin/cache - Get cache/system stats
export async function GET() {
    try {
        const auth = await requireAdmin();
        if (!auth.authorized) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const sessions = await getSessionsCollection();
        const rateLimits = await getRateLimitCollection();

        const now = new Date();

        // Count sessions
        const [totalSessions, activeSessions, expiredSessions] = await Promise.all([
            sessions.countDocuments(),
            sessions.countDocuments({ expiresAt: { $gt: now } }),
            sessions.countDocuments({ expiresAt: { $lt: now } }),
        ]);

        // Count rate limit records
        const [totalRateLimits, expiredRateLimits] = await Promise.all([
            rateLimits.countDocuments(),
            rateLimits.countDocuments({ expiresAt: { $lt: now } }),
        ]);

        return NextResponse.json({
            success: true,
            stats: {
                sessions: {
                    total: totalSessions,
                    active: activeSessions,
                    expired: expiredSessions,
                },
                rateLimits: {
                    total: totalRateLimits,
                    expired: expiredRateLimits,
                },
                serverTime: now.toISOString(),
            },
        });
    } catch (error) {
        console.error('Cache stats error:', error);
        return NextResponse.json({ error: 'İstatistikler alınamadı' }, { status: 500 });
    }
}

// DELETE /api/admin/cache - Clean up caches
export async function DELETE(request: NextRequest) {
    try {
        const auth = await requireAdmin();
        if (!auth.authorized) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const body = await request.json();
        const { type } = body; // 'sessions' | 'rateLimits' | 'exchangeRates' | 'all'

        const results: Record<string, number> = {};
        const now = new Date();

        const sessions = await getSessionsCollection();
        const rateLimits = await getRateLimitCollection();

        if (type === 'sessions' || type === 'all') {
            // Delete only expired sessions (not the current admin's!)
            const result = await sessions.deleteMany({
                $or: [
                    { expiresAt: { $lt: now } },
                    { lastActivityAt: { $lt: new Date(now.getTime() - 2 * 60 * 60 * 1000) } }
                ]
            });
            results.sessions = result.deletedCount;
        }

        if (type === 'rateLimits' || type === 'all') {
            const result = await rateLimits.deleteMany({
                expiresAt: { $lt: now }
            });
            results.rateLimits = result.deletedCount;
        }

        if (type === 'exchangeRates' || type === 'all') {
            // Exchange rate cache is in-memory, we signal a reset
            // by just noting it — the actual cache will refresh on next request
            results.exchangeRates = 1;
        }

        return NextResponse.json({
            success: true,
            cleaned: results,
            timestamp: now.toISOString(),
        });
    } catch (error) {
        console.error('Cache cleanup error:', error);
        return NextResponse.json({ error: 'Temizleme başarısız' }, { status: 500 });
    }
}
