import { NextRequest, NextResponse } from 'next/server';
import { briefTemplates } from '@/lib/briefTypes';
import { verifyMobileSession } from '@/lib/auth/mobileSession';
import { rateLimitMiddleware } from '@/lib/security/rateLimit';

// GET /api/mobile/briefs/template - Get specific brief template details
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

        const { searchParams } = new URL(request.url);
        const typeId = searchParams.get('type');

        if (!typeId) {
            return NextResponse.json(
                { success: false, error: 'Form tipi (type) parametresi gerekli' },
                { status: 400 }
            );
        }

        const template = briefTemplates.find(t => t.id === typeId);

        if (!template) {
            return NextResponse.json(
                { success: false, error: 'Belirtilen form tipi bulunamadı' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            template: {
                id: template.id,
                name: template.name,
                icon: template.icon,
                description: template.description,
                questions: template.questions,
            }
        });

    } catch (error) {
        console.error('Get brief template error:', error);
        return NextResponse.json(
            { success: false, error: 'Template bilgisi alınamadı' },
            { status: 500 }
        );
    }
}

// OPTIONS Handle CORS
export async function OPTIONS() {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    return response;
}
