import { NextRequest, NextResponse } from 'next/server';
import { getProjectsCollection } from '@/lib/mongodb';
import { requireAdmin, verifySession } from '@/lib/auth/session';

// Allowed fields for project creation/listing
const ALLOWED_PROJECT_FIELDS = [
    'id', 'title', 'client', 'category', 'year', 'image', 'description',
    'status', 'progress', 'dueDate', 'linkedAccountId', 'linkedProposalId',
    'linkedBriefToken', 'linkedBrandPageId', 'brandData', 'tasks', 'files',
    'team', 'budget', 'currency', 'url', 'gallery', 'role', 'services',
    'testimonial', 'pageBlocks', 'isPagePublished', 'brandGuide', 'projectAssets',
    'accountId',
];

// GET - List all projects
export async function GET() {
    try {
        const auth = await verifySession();
        const isAdmin = auth.authenticated && auth.role === 'admin';

        const collection = await getProjectsCollection();

        // If not admin, only show published projects
        const filter = isAdmin ? {} : { isPagePublished: true };

        // Optimization: Don't return heavy blocks in the list view
        // to keep payload small and fast.
        const projects = await collection.find(filter, {
            projection: {
                pageBlocks: 0,
                brandGuide: 0,
                projectAssets: 0,
                tasks: 0,
                files: 0,
                team: 0
            }
        }).toArray();

        return NextResponse.json({ projects });
    } catch (error) {
        console.error('Get projects error:', error);
        return NextResponse.json(
            { error: 'Projeler alınamadı' },
            { status: 500 }
        );
    }
}

// POST - Create new project (Admin only)
export async function POST(request: NextRequest) {
    try {
        const auth = await requireAdmin();
        if (!auth.authorized) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const body = await request.json();

        // SECURITY: Only allow whitelisted fields
        const safeProject: Record<string, any> = {
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        for (const key of ALLOWED_PROJECT_FIELDS) {
            if (body[key] !== undefined) {
                safeProject[key] = body[key];
            }
        }

        const collection = await getProjectsCollection();
        const result = await collection.insertOne(safeProject as any);

        return NextResponse.json({
            success: true,
            project: { ...safeProject, _id: result.insertedId }
        });
    } catch (error) {
        console.error('Create project error:', error);
        return NextResponse.json(
            { error: 'Proje oluşturulamadı' },
            { status: 500 }
        );
    }
}
