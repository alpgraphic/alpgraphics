import { NextResponse, NextRequest } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { getAccountsCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * POST /api/client/brief - Submit brief responses safely via session
 * Replaces the token-dependent POST /api/brief/[token] route
 */
export async function POST(request: NextRequest) {
    try {
        const session = await verifySession();

        if (!session.authenticated || !session.userId) {
            return NextResponse.json(
                { error: 'Oturum açmanız gerekiyor' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { responses } = body;

        if (!responses || typeof responses !== 'object') {
            return NextResponse.json({ error: 'Cevaplar gerekli' }, { status: 400 });
        }

        // Sanitize responses
        const sanitizedResponses: Record<string, string> = {};
        const MAX_RESPONSE_LENGTH = 5000;
        const keys = Object.keys(responses);

        for (const key of keys) {
            const value = responses[key];
            if (typeof value === 'string') {
                const cleaned = value
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                    .replace(/<[^>]*>/g, '')
                    .trim()
                    .slice(0, MAX_RESPONSE_LENGTH);
                sanitizedResponses[key] = cleaned;
            } else if (typeof value === 'number' || typeof value === 'boolean') {
                sanitizedResponses[key] = String(value);
            } else if (Array.isArray(value)) {
                // Handle Multi-Select responses
                sanitizedResponses[key] = value.map(v => String(v)).join(', ');
            }
        }

        const accounts = await getAccountsCollection();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await accounts.findOneAndUpdate(
            {
                _id: new ObjectId(session.userId) as any,
                briefStatus: 'pending' // Sadece form bekleyenler gönderebilir
            },
            {
                $set: {
                    briefResponses: sanitizedResponses,
                    briefStatus: 'submitted',
                    briefSubmittedAt: new Date(),
                    updatedAt: new Date()
                }
            },
            { returnDocument: 'after' }
        );

        if (!result) {
            return NextResponse.json({
                success: false,
                error: 'Brief formu bulunamadı veya zaten gönderilmiş'
            }, { status: 404 });
        }

        // Bildirim gönderme bloğu
        try {
            const { getAdminTokens, sendPushNotification } = await import('@/lib/pushNotifications');
            const adminTokens = await getAdminTokens();
            if (adminTokens.length > 0) {
                const company = result.company || result.name || 'Bir müşteri';
                await sendPushNotification(adminTokens, {
                    title: 'Yeni Brief Gönderildi (Web)',
                    body: `${company} web üzerinden briefini doldurdu.`,
                    data: { type: 'brief', accountId: session.userId },
                });
            }
        } catch (notifErr) {
            console.error('Web Brief Notification Error:', notifErr);
        }

        return NextResponse.json({
            success: true,
            message: 'Brief başarıyla gönderildi'
        });

    } catch (error) {
        console.error('Submit brief error:', error);
        return NextResponse.json({ error: 'Brief gönderilemedi' }, { status: 500 });
    }
}
