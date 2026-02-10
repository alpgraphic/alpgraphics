import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAccountsCollection } from '@/lib/mongodb';
import { briefTemplates, BriefTemplate } from '@/lib/briefTypes';

// GET /api/mobile/briefs - Get user's brief data
export async function GET() {
    try {
        const cookieStore = await cookies();
        const clientId = cookieStore.get('mobile_client_id')?.value;

        if (!clientId) {
            return NextResponse.json(
                { success: false, error: 'Yetkilendirme gerekli' },
                { status: 401 }
            );
        }

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
        const cookieStore = await cookies();
        const clientId = cookieStore.get('mobile_client_id')?.value;

        if (!clientId) {
            return NextResponse.json(
                { success: false, error: 'Yetkilendirme gerekli' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { responses } = body;

        if (!responses) {
            return NextResponse.json(
                { success: false, error: 'Cevaplar gereklidir' },
                { status: 400 }
            );
        }

        const accounts = await getAccountsCollection();
        const { ObjectId } = await import('mongodb');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await accounts.updateOne(
            { _id: new ObjectId(clientId) } as any,
            {
                $set: {
                    briefResponses: responses,
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
