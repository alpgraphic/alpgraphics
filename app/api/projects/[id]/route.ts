import { NextRequest, NextResponse } from 'next/server';
import { getProjectsCollection } from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth/session';
import { ObjectId } from 'mongodb';

// GET /api/projects/[id] - Get single project
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await requireAdmin();
        if (!auth.authorized) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const { id } = await params;
        const collection = await getProjectsCollection();

        // Try to find by MongoDB ObjectId first, then by numeric id
        let project = null;
        
        if (ObjectId.isValid(id)) {
            project = await collection.findOne({ _id: new ObjectId(id) } as any);
        }
        
        if (!project) {
            // Try numeric ID
            const numericId = parseInt(id);
            if (!isNaN(numericId)) {
                project = await collection.findOne({ id: numericId });
            }
        }

        if (!project) {
            return NextResponse.json({ error: 'Proje bulunamadı' }, { status: 404 });
        }

        return NextResponse.json({ project });
    } catch (error) {
        console.error('Get project error:', error);
        return NextResponse.json({ error: 'Proje alınamadı' }, { status: 500 });
    }
}

// PUT /api/projects/[id] - Update project
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await requireAdmin();
        if (!auth.authorized) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const collection = await getProjectsCollection();

        // SECURITY: Only allow whitelisted fields
        const ALLOWED_FIELDS = [
            'title', 'client', 'category', 'year', 'image', 'description',
            'status', 'progress', 'dueDate', 'linkedAccountId', 'linkedProposalId',
            'linkedBriefToken', 'linkedBrandPageId', 'brandData', 'tasks', 'files',
            'team', 'budget', 'currency', 'url', 'gallery', 'role', 'services',
            'testimonial', 'pageBlocks', 'isPagePublished', 'brandGuide', 'projectAssets',
            'accountId',
        ];

        const updates: Record<string, any> = { updatedAt: new Date() };
        for (const key of ALLOWED_FIELDS) {
            if (body[key] !== undefined) {
                updates[key] = body[key];
            }
        }

        let result;

        // Try to update by MongoDB ObjectId first
        if (ObjectId.isValid(id)) {
            result = await collection.updateOne(
                { _id: new ObjectId(id) } as any,
                { $set: updates }
            );
        }

        // If not found, try numeric ID
        if (!result || result.matchedCount === 0) {
            const numericId = parseInt(id);
            if (!isNaN(numericId)) {
                result = await collection.updateOne(
                    { id: numericId },
                    { $set: updates }
                );
            }
        }

        if (!result || result.matchedCount === 0) {
            return NextResponse.json({ error: 'Proje bulunamadı' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update project error:', error);
        return NextResponse.json({ error: 'Proje güncellenemedi' }, { status: 500 });
    }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await requireAdmin();
        if (!auth.authorized) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const { id } = await params;
        const collection = await getProjectsCollection();

        let result;

        // Try to delete by MongoDB ObjectId first
        if (ObjectId.isValid(id)) {
            result = await collection.deleteOne({ _id: new ObjectId(id) } as any);
        }

        // If not found, try numeric ID
        if (!result || result.deletedCount === 0) {
            const numericId = parseInt(id);
            if (!isNaN(numericId)) {
                result = await collection.deleteOne({ id: numericId });
            }
        }

        if (!result || result.deletedCount === 0) {
            return NextResponse.json({ error: 'Proje bulunamadı' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete project error:', error);
        return NextResponse.json({ error: 'Proje silinemedi' }, { status: 500 });
    }
}
