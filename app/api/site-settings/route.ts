import { NextRequest, NextResponse } from 'next/server';
import { getSiteSettingsCollection } from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth/session';

// GET - Public (homepage needs this)
export async function GET() {
    try {
        const collection = await getSiteSettingsCollection();
        const settings = await collection.findOne({ key: 'scene' });

        if (!settings) {
            // Return defaults
            return NextResponse.json({
                settings: {
                    key: 'scene',
                    dayImage: null,
                    nightImage: null,
                    dayPosition: { x: 0, y: 0.01, z: 0 },
                    nightPosition: { x: 0, y: 0.02, z: 0 },
                    dayWidth: { desktop: 20, mobile: 15 },
                    nightWidth: { desktop: 20, mobile: 19 },
                    imageAspect: 16 / 9,
                }
            });
        }

        return NextResponse.json({ settings });
    } catch (error) {
        console.error('Get site settings error:', error);
        return NextResponse.json({ error: 'Ayarlar alınamadı' }, { status: 500 });
    }
}

// PUT - Admin only
export async function PUT(request: NextRequest) {
    try {
        const auth = await requireAdmin();
        if (!auth.authorized) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const body = await request.json();

        // Whitelist allowed fields
        const allowedFields = [
            'dayImage', 'nightImage',
            'dayPosition', 'nightPosition',
            'dayWidth', 'nightWidth',
            'imageAspect',
            'seoTitle', 'seoDescription', 'seoKeywords'
        ];

        const update: Record<string, any> = { updatedAt: new Date() };
        for (const key of allowedFields) {
            if (body[key] !== undefined) {
                update[key] = body[key];
            }
        }

        const collection = await getSiteSettingsCollection();
        await collection.updateOne(
            { key: 'scene' },
            { $set: { ...update, key: 'scene' } },
            { upsert: true }
        );

        const updated = await collection.findOne({ key: 'scene' });

        return NextResponse.json({ success: true, settings: updated });
    } catch (error) {
        console.error('Update site settings error:', error);
        return NextResponse.json({ error: 'Ayarlar güncellenemedi' }, { status: 500 });
    }
}
