import { NextRequest, NextResponse } from 'next/server';
import { getAccountsCollection } from '@/lib/mongodb';
import { briefTemplates, BriefTemplate } from '@/lib/briefTypes';
import { verifyMobileSession } from '@/lib/auth/mobileSession';
import { rateLimitMiddleware } from '@/lib/security/rateLimit';

// GET /api/mobile/briefs - Get user's brief data
export async function GET(request: NextRequest) {
    try {
        const rateLimited = await rateLimitMiddleware(request, 'api');
        if (rateLimited) return rateLimited;

        // DB-backed session verification
        const session = await verifyMobileSession();
        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Yetkilendirme gerekli' },
                { status: 401 }
            );
        }

        const clientId = session.userId;

        const accounts = await getAccountsCollection();
        const { ObjectId } = await import('mongodb');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const account = await accounts.findOne({ _id: new ObjectId(clientId) } as any);

        if (!account) {
            return NextResponse.json(
                { success: false, error: 'Hesap bulunamadı' },
                { status: 404 }
            );
        }

        // Get brief template
        const template: BriefTemplate | undefined = account.briefFormType
            ? briefTemplates.find((f: BriefTemplate) => f.id === account.briefFormType)
            : undefined;

        return NextResponse.json({
            success: true,
            data: {
                status: account.briefStatus,
                formType: account.briefFormType,
                responses: account.briefResponses || null,
                submittedAt: account.briefSubmittedAt || null,
                approvedAt: account.briefApprovedAt || null,
                template: template ? {
                    id: template.id,
                    name: template.name,
                    icon: template.icon,
                    description: template.description,
                    questions: template.questions,
                } : null,
            }
        });

    } catch (error) {
        console.error('Get brief error:', error);
        return NextResponse.json(
            { success: false, error: 'Brief bilgisi alınamadı' },
            { status: 500 }
        );
    }
}

// POST /api/mobile/briefs - Submit brief responses
export async function POST(request: NextRequest) {
    try {
        // DB-backed session verification
        const session = await verifyMobileSession();
        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Yetkilendirme gerekli' },
                { status: 401 }
            );
        }

        const clientId = session.userId;

        const body = await request.json();
        const { responses } = body;

        if (!responses) {
            return NextResponse.json(
                { success: false, error: 'Cevaplar gereklidir' },
                { status: 400 }
            );
        }

        // Input validation: responses must be an object
        if (typeof responses !== 'object' || Array.isArray(responses)) {
            return NextResponse.json(
                { success: false, error: 'Geçersiz cevap formatı' },
                { status: 400 }
            );
        }

        // Sanitize responses: strip HTML/script tags, limit lengths
        const sanitizedResponses: Record<string, string> = {};
        const MAX_RESPONSE_LENGTH = 5000;
        const MAX_RESPONSES = 50;

        const keys = Object.keys(responses);
        if (keys.length > MAX_RESPONSES) {
            return NextResponse.json(
                { success: false, error: 'Çok fazla cevap gönderildi' },
                { status: 400 }
            );
        }

        for (const key of keys) {
            const value = responses[key];
            if (typeof value === 'string') {
                // Strip potential HTML/script content
                const cleaned = value
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                    .replace(/<[^>]*>/g, '')
                    .trim()
                    .slice(0, MAX_RESPONSE_LENGTH);
                sanitizedResponses[key] = cleaned;
            } else if (typeof value === 'number' || typeof value === 'boolean') {
                sanitizedResponses[key] = String(value);
            }
            // Skip non-string/number/boolean values
        }

        const accounts = await getAccountsCollection();
        const { ObjectId } = await import('mongodb');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await accounts.updateOne(
            { _id: new ObjectId(clientId) } as any,
            {
                $set: {
                    briefResponses: sanitizedResponses,
                    briefStatus: 'submitted',
                    briefSubmittedAt: new Date(),
                    updatedAt: new Date(),
                }
            }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { success: false, error: 'Hesap bulunamadı' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Brief başarıyla gönderildi',
            data: {
                status: 'submitted',
                submittedAt: new Date().toISOString(),
            }
        });

    } catch (error) {
        console.error('Submit brief error:', error);
        return NextResponse.json(
            { success: false, error: 'Brief gönderilemedi' },
            { status: 500 }
        );
    }
}
