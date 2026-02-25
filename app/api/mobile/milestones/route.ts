import { NextRequest, NextResponse } from 'next/server';
import { getMilestonesCollection, getProjectsCollection } from '@/lib/mongodb';
import { verifyMobileSession } from '@/lib/auth/mobileSession';
import { rateLimitMiddleware } from '@/lib/security/rateLimit';
import { sendPushNotification, getTokensForUser } from '@/lib/pushNotifications';

// ─── GET /api/mobile/milestones?projectId=xxx ─────────────────────────────────
// Admin: all milestones | Client: only completed ones
export async function GET(request: NextRequest) {
    try {
        const rateLimited = await rateLimitMiddleware(request, 'api');
        if (rateLimited) return rateLimited;

        const session = await verifyMobileSession();
        if (!session?.userId) {
            return NextResponse.json({ success: false, error: 'Yetkilendirme gerekli' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');
        const milestoneId = searchParams.get('milestoneId'); // single fetch with full image data

        const col = await getMilestonesCollection();
        const { ObjectId } = await import('mongodb');

        // ── Single milestone with full image data ──
        if (milestoneId) {
            const m = await col.findOne({ _id: new ObjectId(milestoneId) } as any);
            if (!m) return NextResponse.json({ success: false, error: 'Bulunamadı' }, { status: 404 });
            return NextResponse.json({
                success: true,
                data: {
                    id: m._id?.toString(),
                    projectId: m.projectId,
                    title: m.title,
                    description: m.description,
                    status: m.status,
                    order: m.order,
                    attachments: m.attachments,  // full imageData included
                    feedback: m.feedback ?? {},
                    completedAt: m.completedAt,
                    createdAt: m.createdAt,
                },
            });
        }

        if (!projectId) {
            return NextResponse.json({ success: false, error: 'projectId gerekli' }, { status: 400 });
        }

        const query = session.role === 'admin'
            ? { projectId }
            : { projectId, status: 'completed' as const };

        const milestones = await col
            .find(query, {
                // Strip raw imageData from list view — sent only on detail fetch
                projection: { 'attachments.imageData': 0 },
            })
            .sort({ order: 1, createdAt: 1 })
            .toArray();

        return NextResponse.json({
            success: true,
            data: milestones.map(m => ({
                id: m._id?.toString(),
                projectId: m.projectId,
                title: m.title,
                description: m.description,
                status: m.status,
                order: m.order,
                hasAttachments: m.attachments.length > 0,
                attachmentCount: m.attachments.length,
                attachmentIds: m.attachments.map(a => a.id),
                feedback: m.feedback ?? {},
                completedAt: m.completedAt,
                createdAt: m.createdAt,
            })),
        });
    } catch (error) {
        console.error('Milestones GET error:', error);
        return NextResponse.json({ success: false, error: 'Yüklenemedi' }, { status: 500 });
    }
}

// ─── POST /api/mobile/milestones ──────────────────────────────────────────────
// Admin: create a new (pending) milestone
export async function POST(request: NextRequest) {
    try {
        const rateLimited = await rateLimitMiddleware(request, 'api');
        if (rateLimited) return rateLimited;

        const session = await verifyMobileSession();
        if (!session?.userId || session.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 403 });
        }

        const body = await request.json();
        const { projectId, title, description } = body;

        if (!projectId || !title?.trim()) {
            return NextResponse.json({ success: false, error: 'projectId ve title gerekli' }, { status: 400 });
        }

        // Resolve linked accountId from project
        const { ObjectId } = await import('mongodb');
        const projects = await getProjectsCollection();
        const project = ObjectId.isValid(projectId)
            ? await projects.findOne({ _id: new ObjectId(projectId) } as any)
            : null;
        const accountId = (project as any)?.linkedAccountId ?? undefined;

        const col = await getMilestonesCollection();

        // Order = last + 1
        const lastMilestone = await col
            .find({ projectId })
            .sort({ order: -1 })
            .limit(1)
            .toArray();
        const order = (lastMilestone[0]?.order ?? -1) + 1;

        const doc = {
            projectId,
            accountId,
            title: title.trim(),
            description: description?.trim() ?? undefined,
            status: 'pending' as const,
            order,
            attachments: [],
            feedback: {},
            createdAt: new Date(),
        };

        const result = await col.insertOne(doc as any);

        return NextResponse.json({
            success: true,
            data: { id: result.insertedId.toString(), ...doc },
        });
    } catch (error) {
        console.error('Milestones POST error:', error);
        return NextResponse.json({ success: false, error: 'Oluşturulamadı' }, { status: 500 });
    }
}

// ─── PUT /api/mobile/milestones ───────────────────────────────────────────────
// Admin: complete a milestone + optionally attach images → sends push notification
// Body: { id, attachments?: [{id, imageData, mimeType}] }
export async function PUT(request: NextRequest) {
    try {
        const rateLimited = await rateLimitMiddleware(request, 'api');
        if (rateLimited) return rateLimited;

        const session = await verifyMobileSession();
        if (!session?.userId || session.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 403 });
        }

        const body = await request.json();
        const { id, attachments } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: 'id gerekli' }, { status: 400 });
        }

        const { ObjectId } = await import('mongodb');
        const col = await getMilestonesCollection();

        // Validate attachments (max 5, each imageData must be base64)
        const validAttachments = Array.isArray(attachments)
            ? attachments.slice(0, 5).map((a: any) => ({
                id: a.id ?? crypto.randomUUID(),
                imageData: String(a.imageData ?? ''),
                mimeType: String(a.mimeType ?? 'image/jpeg'),
            }))
            : [];

        const now = new Date();
        const result = await col.updateOne(
            { _id: new ObjectId(id) } as any,
            {
                $set: {
                    status: 'completed',
                    attachments: validAttachments,
                    completedAt: now,
                },
            }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ success: false, error: 'Milestone bulunamadı' }, { status: 404 });
        }

        // Fetch milestone to get accountId + title for notification
        const milestone = await col.findOne(
            { _id: new ObjectId(id) } as any,
            { projection: { accountId: 1, title: 1, projectId: 1 } }
        );

        // Return response immediately
        const response = NextResponse.json({ success: true });

        // Fire-and-forget: push notification + progress update
        (async () => {
            // Push notification to client
            if (milestone?.accountId) {
                try {
                    const tokens = await getTokensForUser(milestone.accountId);
                    if (tokens.length > 0) {
                        const hasPhotos = validAttachments.length > 0;
                        await sendPushNotification(tokens, {
                            title: '📋 Proje Güncellendi',
                            body: hasPhotos
                                ? `${milestone.title} — ${validAttachments.length} yeni görsel eklendi`
                                : milestone.title,
                            data: {
                                type: 'milestone',
                                milestoneId: id,
                                projectId: milestone.projectId,
                            },
                        });
                    }
                } catch (notifErr) {
                    console.error('Milestone push notification error:', notifErr);
                }
            }

            // Update project progress
            try {
                const all = await col.find({ projectId: milestone?.projectId }).toArray();
                const completed = all.filter(m => m.status === 'completed').length;
                const total = all.length;
                const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

                const projects = await getProjectsCollection();
                if (milestone?.projectId && ObjectId.isValid(milestone.projectId)) {
                    await projects.updateOne(
                        { _id: new ObjectId(milestone.projectId) } as any,
                        { $set: { progress, updatedAt: now } }
                    );
                }
            } catch (progressErr) {
                console.error('Progress update error:', progressErr);
            }
        })();

        return response;
    } catch (error) {
        console.error('Milestones PUT error:', error);
        return NextResponse.json({ success: false, error: 'Güncellenemedi' }, { status: 500 });
    }
}

// ─── DELETE /api/mobile/milestones?id=xxx ─────────────────────────────────────
// Admin: delete a milestone
export async function DELETE(request: NextRequest) {
    try {
        const session = await verifyMobileSession();
        if (!session?.userId || session.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ success: false, error: 'id gerekli' }, { status: 400 });
        }

        const { ObjectId } = await import('mongodb');
        const col = await getMilestonesCollection();
        await col.deleteOne({ _id: new ObjectId(id) } as any);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Milestones DELETE error:', error);
        return NextResponse.json({ success: false, error: 'Silinemedi' }, { status: 500 });
    }
}

// ─── GET single milestone WITH images ─────────────────────────────────────────
// Called separately via ?id=xxx to avoid sending base64 in list
export async function OPTIONS() {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
}
