import { NextResponse } from 'next/server';
import { getProjectsCollection } from '@/lib/mongodb';

// Public fields only - lightweight for list view (no heavy brandData)
const PUBLIC_FIELDS = {
    _id: 1,
    id: 1,
    title: 1,
    client: 1,
    category: 1,
    year: 1,
    image: 1,
    description: 1,
    status: 1,
    isPagePublished: 1,
    linkedBrandPageId: 1,
    // brandData loaded per-project via /api/public/projects/[id]
};

// GET - List published projects (NO AUTH REQUIRED)
export async function GET() {
    try {
        const collection = await getProjectsCollection();

        // Only return published projects
        const projects = await collection
            .find(
                { isPagePublished: true },
                { projection: PUBLIC_FIELDS }
            )
            .toArray();

        // Cache for 60 seconds to reduce DB load
        return NextResponse.json(
            { projects },
            {
                headers: {
                    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
                },
            }
        );
    } catch (error) {
        console.error('Public projects error:', error);
        return NextResponse.json(
            { error: 'Failed to load projects' },
            { status: 500 }
        );
    }
}
