import { NextRequest, NextResponse } from 'next/server';
import { getProjectsCollection } from '@/lib/mongodb';
import { rateLimitMiddleware } from '@/lib/security/rateLimit';
import { verifyMobileSession } from '@/lib/auth/mobileSession';

// GET /api/mobile/projects - Get projects for authenticated user
export async function GET(request: NextRequest) {
    try {
        // Rate limiting
        const rateLimited = await rateLimitMiddleware(request, 'api');
        if (rateLimited) return rateLimited;

        // Verify session against DB
        const session = await verifyMobileSession();
        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Yetkilendirme gerekli' },
                { status: 401 }
            );
        }

        const clientId = session.userId;
        const role = session.role;

        const projects = await getProjectsCollection();

        if (role === 'admin') {
            // Admin sees all projects (lightweight list)
            const allProjects = await projects.find({}, {
                projection: {
                    pageBlocks: 0,
                    brandGuide: 0,
                    projectAssets: 0,
                    tasks: 0,
                    files: 0,
                    team: 0,
                }
            }).sort({ createdAt: -1 }).toArray();

            return NextResponse.json({
                success: true,
                data: allProjects.map(p => ({
                    id: p._id?.toString(),
                    title: p.title,
                    client: p.client,
                    category: p.category,
                    year: p.year,
                    image: p.image,
                    status: p.status || 'active',
                    progress: p.progress || 0,
                    dueDate: p.dueDate,
                    linkedAccountId: p.linkedAccountId,
                    budget: (p as any).budget,
                    currency: (p as any).currency,
                    createdAt: p.createdAt,
                })),
            });
        }

        // Client: only see projects linked to their account
        const clientProjects = await projects.find(
            {
                $or: [
                    { linkedAccountId: clientId },
                    { accountId: clientId },
                ]
            },
            {
                projection: {
                    pageBlocks: 0,
                    brandGuide: 0,
                    projectAssets: 0,
                    tasks: 0,
                    files: 0,
                    team: 0,
                }
            }
        ).sort({ createdAt: -1 }).toArray();

        return NextResponse.json({
            success: true,
            data: clientProjects.map(p => ({
                id: p._id?.toString(),
                title: p.title,
                category: p.category,
                year: p.year,
                image: p.image,
                status: p.status || 'active',
                progress: p.progress || 0,
                dueDate: p.dueDate,
                createdAt: p.createdAt,
            })),
        });

    } catch (error) {
        console.error('Mobile projects error:', error);
        return NextResponse.json(
            { success: false, error: 'Projeler alınamadı' },
            { status: 500 }
        );
    }
}

// PUT /api/mobile/projects - Update project status and progress (Admin only)
export async function PUT(request: NextRequest) {
    try {
        const rateLimited = await rateLimitMiddleware(request, 'api');
        if (rateLimited) return rateLimited;

        const session = await verifyMobileSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'Yetkilendirme gerekli' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { id, status, progress } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: 'Proje ID gerekli' }, { status: 400 });
        }

        const { ObjectId } = await import('mongodb');
        const projects = await getProjectsCollection();

        const updates: Record<string, any> = { updatedAt: new Date() };
        if (status !== undefined) updates.status = status;
        if (progress !== undefined) updates.progress = Math.min(100, Math.max(0, Number(progress) || 0));

        let result;
        if (ObjectId.isValid(id) && String(new ObjectId(id)) === id) {
            result = await projects.updateOne(
                { _id: new ObjectId(id) } as any,
                { $set: updates }
            );
        }

        if (!result || result.matchedCount === 0) {
            return NextResponse.json({ success: false, error: 'Proje bulunamadı' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Mobile projects PUT error:', error);
        return NextResponse.json(
            { success: false, error: 'Proje güncellenemedi' },
            { status: 500 }
        );
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
