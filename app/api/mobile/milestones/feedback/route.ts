import { NextRequest, NextResponse } from 'next/server';
import { getMilestonesCollection } from '@/lib/mongodb';
import { verifyMobileSession } from '@/lib/auth/mobileSession';
import { rateLimitMiddleware } from '@/lib/security/rateLimit';

// POST /api/mobile/milestones/feedback
// Client: { milestoneId, attachmentId, feedback: 'liked' | 'disliked' }
export async function POST(request: NextRequest) {
    try {
        const rateLimited = await rateLimitMiddleware(request, 'api');
        if (rateLimited) return rateLimited;

        const session = await verifyMobileSession();
        if (!session?.userId) {
            return NextResponse.json({ success: false, error: 'Yetkilendirme gerekli' }, { status: 401 });
        }

        const body = await request.json();
        const { milestoneId, attachmentId, feedback } = body;

        if (!milestoneId || !attachmentId || !['liked', 'disliked'].includes(feedback)) {
            return NextResponse.json({ success: false, error: 'Geçersiz istek' }, { status: 400 });
        }

        const { ObjectId } = await import('mongodb');
        const col = await getMilestonesCollection();

        // Store feedback keyed by attachmentId
        const result = await col.updateOne(
            { _id: new ObjectId(milestoneId) } as any,
            { $set: { [`feedback.${attachmentId}`]: feedback } }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ success: false, error: 'Milestone bulunamadı' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Milestone feedback error:', error);
        return NextResponse.json({ success: false, error: 'Kaydedilemedi' }, { status: 500 });
    }
}

export async function OPTIONS() {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
}
