import { NextRequest, NextResponse } from 'next/server';
import { getProjectsCollection } from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth/session';

// POST - Bulk sync projects from localStorage to DB (Admin only)
export async function POST(request: NextRequest) {
    try {
        const auth = await requireAdmin();
        if (!auth.authorized) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const body = await request.json();
        const { projects } = body;

        if (!Array.isArray(projects) || projects.length === 0) {
            return NextResponse.json({ error: 'No projects provided' }, { status: 400 });
        }

        const collection = await getProjectsCollection();
        let synced = 0;
        let skipped = 0;
        const results: { id: string | number; action: string }[] = [];

        for (const project of projects) {
            if (!project.id) {
                skipped++;
                continue;
            }

            // Skip demo projects
            if (String(project.id).startsWith('demo-')) {
                skipped++;
                results.push({ id: project.id, action: 'skipped (demo)' });
                continue;
            }

            // Check if project already exists in DB
            const existingByNumericId = await collection.findOne({ id: project.id });
            const existingByStringId = await collection.findOne({ id: String(project.id) } as any);
            const existing = existingByNumericId || existingByStringId;

            if (existing) {
                // Update existing — merge brandData if present
                const updateData: Record<string, any> = {
                    updatedAt: new Date(),
                };

                // Only update fields that have actual data
                const fieldsToSync = [
                    'title', 'client', 'category', 'year', 'image', 'description',
                    'status', 'progress', 'isPagePublished', 'brandData', 'pageBlocks',
                    'linkedAccountId', 'linkedProposalId', 'linkedBriefToken',
                    'linkedBrandPageId', 'brandGuide', 'projectAssets',
                    'tasks', 'files', 'team', 'gallery', 'role', 'services', 'testimonial'
                ];

                for (const field of fieldsToSync) {
                    if (project[field] !== undefined && project[field] !== null) {
                        updateData[field] = project[field];
                    }
                }

                await collection.updateOne(
                    { _id: existing._id },
                    { $set: updateData }
                );
                synced++;
                results.push({ id: project.id, action: 'updated' });
            } else {
                // Insert new project
                const newProject: Record<string, any> = {
                    ...project,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                // Remove undefined fields
                for (const key of Object.keys(newProject)) {
                    if (newProject[key] === undefined) {
                        delete newProject[key];
                    }
                }
                await collection.insertOne(newProject as any);
                synced++;
                results.push({ id: project.id, action: 'inserted' });
            }
        }

        return NextResponse.json({
            success: true,
            synced,
            skipped,
            total: projects.length,
            results,
        });
    } catch (error) {
        console.error('Sync projects error:', error);
        return NextResponse.json(
            { error: 'Senkronizasyon başarısız' },
            { status: 500 }
        );
    }
}
