import { NextRequest, NextResponse } from 'next/server';
import { getProjectsCollection } from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth/session';

// Allowed fields for project creation/listing
const ALLOWED_PROJECT_FIELDS = [
    'id', 'title', 'client', 'category', 'year', 'image', 'description',
    'status', 'progress', 'dueDate', 'linkedAccountId', 'linkedProposalId',
    'linkedBriefToken', 'linkedBrandPageId', 'brandData', 'tasks', 'files',
    'team', 'budget', 'currency', 'url', 'gallery', 'role', 'services',
    'testimonial', 'pageBlocks', 'isPagePublished', 'brandGuide', 'projectAssets',
    'accountId',
];

// GET - List all projects (Admin only)
export async function GET() {
    try {
        const auth = await requireAdmin();
        if (!auth.authorized) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const collection = await getProjectsCollection();
        const projects = await collection.find({}).toArray();

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
