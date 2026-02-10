import { NextRequest, NextResponse } from 'next/server';
import { getProjectsCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET - Get a single published project (NO AUTH REQUIRED)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const collection = await getProjectsCollection();

        let project = null;

        // Try to find by MongoDB ObjectId first
        if (ObjectId.isValid(id)) {
            project = await collection.findOne({ _id: new ObjectId(id) } as any);
        }

        // Then try by numeric id
        if (!project) {
            const numericId = parseInt(id);
            if (!isNaN(numericId)) {
                project = await collection.findOne({ id: numericId });
            }
        }

        // Then try by string id
        if (!project) {
            project = await collection.findOne({ id: id });
        }

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Only allow access to published projects
        if (!project.isPagePublished) {
            return NextResponse.json({ error: 'Project not published' }, { status: 404 });
        }

        return NextResponse.json(
            { project },
            {
                headers: {
                    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
                },
            }
        );
    } catch (error) {
        console.error('Public project error:', error);
        return NextResponse.json(
            { error: 'Failed to load project' },
            { status: 500 }
        );
    }
}
