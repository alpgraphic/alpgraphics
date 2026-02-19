import { NextRequest, NextResponse } from 'next/server';
import { getPlannerTasksCollection } from '@/lib/mongodb';
import { verifyMobileSession } from '@/lib/auth/mobileSession';
import { rateLimitMiddleware } from '@/lib/security/rateLimit';
import { ObjectId } from 'mongodb';

// GET /api/mobile/planner?date=YYYY-MM-DD
export async function GET(request: NextRequest) {
    try {
        const rateLimited = await rateLimitMiddleware(request, 'api');
        if (rateLimited) return rateLimited;

        const session = await verifyMobileSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

        const col = await getPlannerTasksCollection();
        const tasks = await col
            .find({ userId: session.userId, date })
            .sort({ order: 1, createdAt: 1 })
            .toArray();

        return NextResponse.json({
            success: true,
            data: tasks.map(t => ({
                id: t._id?.toString(),
                userId: t.userId,
                title: t.title,
                notes: t.notes,
                date: t.date,
                startTime: t.startTime,
                dueTime: t.dueTime,
                isCompleted: t.isCompleted,
                completedAt: t.completedAt,
                priority: t.priority,
                color: t.color,
                isBreak: t.isBreak,
                duration: t.duration,
                order: t.order,
                repeatDaily: t.repeatDaily,
                projectTag: t.projectTag,
                estimatedMinutes: t.estimatedMinutes,
                createdAt: t.createdAt,
            })),
        });
    } catch (error) {
        console.error('Planner GET error:', error);
        return NextResponse.json({ success: false, error: 'Görevler alınamadı' }, { status: 500 });
    }
}

// POST /api/mobile/planner - Create task
export async function POST(request: NextRequest) {
    try {
        const rateLimited = await rateLimitMiddleware(request, 'api');
        if (rateLimited) return rateLimited;

        const session = await verifyMobileSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 });
        }

        const body = await request.json();
        const col = await getPlannerTasksCollection();

        const ALLOWED = [
            'title', 'notes', 'date', 'startTime', 'dueTime', 'priority',
            'color', 'isBreak', 'duration', 'order', 'repeatDaily',
            'projectTag', 'estimatedMinutes',
        ];

        const task: Record<string, any> = {
            userId: session.userId,
            isCompleted: false,
            priority: 'normal',
            isBreak: false,
            order: 0,
            repeatDaily: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        for (const key of ALLOWED) {
            if (body[key] !== undefined) task[key] = body[key];
        }

        const result = await col.insertOne(task as any);
        return NextResponse.json({
            success: true,
            task: { ...task, id: result.insertedId.toString() },
        });
    } catch (error) {
        console.error('Planner POST error:', error);
        return NextResponse.json({ success: false, error: 'Görev oluşturulamadı' }, { status: 500 });
    }
}

// PUT /api/mobile/planner - Update task
export async function PUT(request: NextRequest) {
    try {
        const rateLimited = await rateLimitMiddleware(request, 'api');
        if (rateLimited) return rateLimited;

        const session = await verifyMobileSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 });
        }

        const body = await request.json();
        const { id, isCompleted, ...rest } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID gerekli' }, { status: 400 });
        }

        const col = await getPlannerTasksCollection();
        const ALLOWED = [
            'title', 'notes', 'date', 'startTime', 'dueTime', 'priority',
            'color', 'isBreak', 'duration', 'order', 'repeatDaily',
            'projectTag', 'estimatedMinutes',
        ];

        const updates: Record<string, any> = { updatedAt: new Date() };
        if (isCompleted !== undefined) {
            updates.isCompleted = isCompleted;
            updates.completedAt = isCompleted ? new Date() : null;
        }
        for (const key of ALLOWED) {
            if (rest[key] !== undefined) updates[key] = rest[key];
        }

        if (ObjectId.isValid(id)) {
            await col.updateOne(
                { _id: new ObjectId(id) as any, userId: session.userId },
                { $set: updates }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Planner PUT error:', error);
        return NextResponse.json({ success: false, error: 'Görev güncellenemedi' }, { status: 500 });
    }
}

// DELETE /api/mobile/planner?id=xxx
export async function DELETE(request: NextRequest) {
    try {
        const session = await verifyMobileSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID gerekli' }, { status: 400 });

        const col = await getPlannerTasksCollection();
        if (ObjectId.isValid(id)) {
            await col.deleteOne({ _id: new ObjectId(id) as any, userId: session.userId });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Planner DELETE error:', error);
        return NextResponse.json({ success: false, error: 'Görev silinemedi' }, { status: 500 });
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
