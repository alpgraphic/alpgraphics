import { NextRequest, NextResponse } from 'next/server';
import { getPushTokensCollection } from '@/lib/mongodb';
import { verifyMobileSession } from '@/lib/auth/mobileSession';
import { rateLimitMiddleware } from '@/lib/security/rateLimit';

// POST /api/mobile/push-token - Register or update push token
export async function POST(request: NextRequest) {
    try {
        const rateLimited = await rateLimitMiddleware(request, 'api');
        if (rateLimited) return rateLimited;

        const session = await verifyMobileSession();
        if (!session || !session.userId) {
            return NextResponse.json({ success: false, error: 'Yetkilendirme gerekli' }, { status: 401 });
        }

        const body = await request.json();
        const { token, platform } = body;

        if (!token || typeof token !== 'string') {
            return NextResponse.json({ success: false, error: 'Geçerli token gerekli' }, { status: 400 });
        }

        const col = await getPushTokensCollection();
        await col.updateOne(
            { userId: session.userId },
            {
                $set: {
                    userId: session.userId,
                    role: session.role as 'admin' | 'client',
                    token,
                    platform: platform || 'unknown',
                    updatedAt: new Date(),
                },
            },
            { upsert: true }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Push token save error:', error);
        return NextResponse.json({ success: false, error: 'Token kaydedilemedi' }, { status: 500 });
    }
}

// DELETE /api/mobile/push-token - Remove push token on logout
export async function DELETE(request: NextRequest) {
    try {
        const session = await verifyMobileSession();
        if (!session || !session.userId) {
            return NextResponse.json({ success: false }, { status: 401 });
        }

        const col = await getPushTokensCollection();
        await col.deleteOne({ userId: session.userId });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Push token delete error:', error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}

// OPTIONS Handle CORS
export async function OPTIONS() {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    return response;
}
