import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
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

        const cookieStore = await cookies();
        const clientId = cookieStore.get('mobile_client_id')?.value;
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
