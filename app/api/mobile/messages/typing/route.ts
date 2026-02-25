import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { verifyMobileSession } from '@/lib/auth/mobileSession';

/**
 * Typing indicator API.
 * POST — set typing status (ephemeral, 6-second TTL)
 * GET  — check if counterpart is typing
 */

// POST /api/mobile/messages/typing
export async function POST(request: NextRequest) {
    try {
        const session = await verifyMobileSession();
        if (!session?.userId) {
            return NextResponse.json({ success: false }, { status: 401 });
        }

        const { accountId } = await request.json();
        if (!accountId) {
            return NextResponse.json({ success: false }, { status: 400 });
        }

        const db = await getDb();
        const col = db.collection('typing_status');

        await col.updateOne(
            { accountId, userId: session.userId },
            {
                $set: {
                    accountId,
                    userId: session.userId,
                    role: session.role,
                    updatedAt: new Date(),
                    expiresAt: new Date(Date.now() + 6000), // TTL: 6 seconds
                },
            },
            { upsert: true }
        );

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}

// GET /api/mobile/messages/typing?accountId=xxx
export async function GET(request: NextRequest) {
    try {
        const session = await verifyMobileSession();
        if (!session?.userId) {
            return NextResponse.json({ success: false }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const accountId = searchParams.get('accountId');
        if (!accountId) {
            return NextResponse.json({ success: false }, { status: 400 });
        }

        const db = await getDb();
        const col = db.collection('typing_status');

        // Find counterpart's typing status (not our own, within TTL)
        const typing = await col.findOne({
            accountId,
            userId: { $ne: session.userId },
            updatedAt: { $gt: new Date(Date.now() - 6000) },
        });

        return NextResponse.json({
            success: true,
            typing: !!typing,
            role: typing?.role || null,
        });
    } catch {
        return NextResponse.json({ success: false, typing: false }, { status: 500 });
    }
}
