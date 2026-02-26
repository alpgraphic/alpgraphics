import { NextRequest, NextResponse } from 'next/server';
import { getMessagesCollection } from '@/lib/mongodb';
import { verifyMobileSession } from '@/lib/auth/mobileSession';
import { rateLimitMiddleware } from '@/lib/security/rateLimit';
import { sendPushNotification, getTokensForUser, getAdminTokens } from '@/lib/pushNotifications';

// GET /api/mobile/messages - Get messages
// Admin: ?accountId=xxx → messages for that conversation
//        no param → all conversations summary
// Client: own conversation only
export async function GET(request: NextRequest) {
    try {
        const rateLimited = await rateLimitMiddleware(request, 'api');
        if (rateLimited) return rateLimited;

        const session = await verifyMobileSession();
        if (!session || !session.userId) {
            return NextResponse.json({ success: false, error: 'Yetkilendirme gerekli' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const accountId = searchParams.get('accountId');
        const col = await getMessagesCollection();

        if (session.role === 'admin') {
            if (accountId) {
                // Get messages for specific conversation
                const afterParam = searchParams.get('after');
                const query: any = { accountId };
                if (afterParam) {
                    // Incremental polling: only fetch messages newer than 'after'
                    query.createdAt = { $gt: new Date(afterParam) };
                }

                const messages = await col
                    .find(query)
                    .sort({ createdAt: 1 })
                    .limit(200)
                    .toArray();

                // Mark unread messages as read
                await col.updateMany(
                    { accountId, senderRole: 'client', readAt: { $exists: false } },
                    { $set: { readAt: new Date() } }
                );

                return NextResponse.json({
                    success: true,
                    data: messages.map(m => ({
                        id: m._id?.toString(),
                        accountId: m.accountId,
                        senderId: m.senderId,
                        senderRole: m.senderRole,
                        senderName: m.senderName,
                        content: m.content,
                        createdAt: m.createdAt,
                        readAt: m.readAt,
                    })),
                });
            }

            // Get all conversation summaries — single pipeline with $lookup (no N+1)
            const { ObjectId } = await import('mongodb');
            const pipeline = [
                { $sort: { createdAt: -1 as const } },
                {
                    $group: {
                        _id: '$accountId',
                        lastMessage: { $first: '$content' },
                        lastSenderRole: { $first: '$senderRole' },
                        lastSenderName: { $first: '$senderName' },
                        lastCreatedAt: { $first: '$createdAt' },
                        unreadCount: {
                            $sum: {
                                $cond: [
                                    { $and: [{ $eq: ['$senderRole', 'client'] }, { $not: { $ifNull: ['$readAt', false] } }] },
                                    1,
                                    0,
                                ],
                            },
                        },
                    },
                },
                // Convert string _id to ObjectId for $lookup
                {
                    $addFields: {
                        accountObjId: {
                            $cond: {
                                if: { $regexMatch: { input: '$_id', regex: /^[0-9a-fA-F]{24}$/ } },
                                then: { $toObjectId: '$_id' },
                                else: null,
                            },
                        },
                    },
                },
                // $lookup replaces N+1 per-conversation findOne queries with a single join
                {
                    $lookup: {
                        from: 'accounts',
                        localField: 'accountObjId',
                        foreignField: '_id',
                        as: 'account',
                    },
                },
                { $unwind: { path: '$account', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        accountId: '$_id',
                        accountName: { $ifNull: ['$account.name', '$_id'] },
                        companyName: { $ifNull: ['$account.company', { $ifNull: ['$account.name', '$_id'] }] },
                        lastMessage: 1,
                        lastSenderRole: 1,
                        lastCreatedAt: 1,
                        unreadCount: 1,
                    },
                },
                { $sort: { lastCreatedAt: -1 as const } },
            ];

            const enriched = await col.aggregate(pipeline as any[]).toArray();

            const response = NextResponse.json({ success: true, data: enriched });
            // Cache for 10 seconds — reduces repeated calls while polling
            response.headers.set('Cache-Control', 'private, max-age=10');
            return response;
        }

        // Client: own conversation
        const clientAccountId = session.userId;
        const afterParam = searchParams.get('after');
        const clientQuery: any = { accountId: clientAccountId };
        if (afterParam) {
            clientQuery.createdAt = { $gt: new Date(afterParam) };
        }

        const messages = await col
            .find(clientQuery)
            .sort({ createdAt: 1 })
            .limit(200)
            .toArray();

        // Mark admin messages as read
        await col.updateMany(
            { accountId: clientAccountId, senderRole: 'admin', readAt: { $exists: false } },
            { $set: { readAt: new Date() } }
        );

        return NextResponse.json({
            success: true,
            data: messages.map(m => ({
                id: m._id?.toString(),
                senderId: m.senderId,
                senderRole: m.senderRole,
                senderName: m.senderName,
                content: m.content,
                createdAt: m.createdAt,
                readAt: m.readAt,
            })),
        });

    } catch (error) {
        console.error('Messages GET error:', error);
        return NextResponse.json({ success: false, error: 'Mesajlar alınamadı' }, { status: 500 });
    }
}

// POST /api/mobile/messages - Send a message
export async function POST(request: NextRequest) {
    try {
        const rateLimited = await rateLimitMiddleware(request, 'api');
        if (rateLimited) return rateLimited;

        const session = await verifyMobileSession();
        if (!session || !session.userId) {
            return NextResponse.json({ success: false, error: 'Yetkilendirme gerekli' }, { status: 401 });
        }

        const body = await request.json();
        const { content, accountId: bodyAccountId } = body;

        if (!content?.trim()) {
            return NextResponse.json({ success: false, error: 'Mesaj boş olamaz' }, { status: 400 });
        }

        const col = await getMessagesCollection();

        // Determine accountId (for admin, they pass accountId; for client, it's their own userId)
        const resolvedAccountId = session.role === 'admin'
            ? bodyAccountId
            : session.userId;

        if (!resolvedAccountId) {
            return NextResponse.json({ success: false, error: 'accountId gerekli' }, { status: 400 });
        }

        const { getAccountsCollection } = await import('@/lib/mongodb');
        const accounts = await getAccountsCollection();
        const { ObjectId } = await import('mongodb');

        let senderName = 'Alp Graphics';
        if (session.role === 'client' && ObjectId.isValid(session.userId)) {
            const acc = await accounts.findOne({ _id: new ObjectId(session.userId) } as any);
            if (acc) senderName = acc.name || senderName;
        }

        const message = {
            accountId: resolvedAccountId,
            senderId: session.userId,
            senderRole: session.role as 'admin' | 'client',
            senderName,
            content: content.trim(),
            createdAt: new Date(),
        };

        const result = await col.insertOne(message as any);

        // Return response IMMEDIATELY — don't wait for push notification
        const response = NextResponse.json({
            success: true,
            message: {
                id: result.insertedId.toString(),
                ...message,
            },
        });

        // Push notification to recipient (fire-and-forget — don't block response)
        (async () => {
            try {
                const senderTokens = await getTokensForUser(session.userId!);

                if (session.role === 'client') {
                    const adminTokens = (await getAdminTokens()).filter(
                        t => !senderTokens.includes(t)
                    );
                    if (adminTokens.length > 0) {
                        await sendPushNotification(adminTokens, {
                            title: `${senderName} mesaj gönderdi`,
                            body: content.trim().substring(0, 100),
                            data: { type: 'message', accountId: resolvedAccountId },
                        });
                    }
                } else {
                    const clientTokens = (await getTokensForUser(resolvedAccountId)).filter(
                        t => !senderTokens.includes(t)
                    );
                    if (clientTokens.length > 0) {
                        await sendPushNotification(clientTokens, {
                            title: 'Alp Graphics',
                            body: content.trim().substring(0, 100),
                            data: { type: 'message', accountId: resolvedAccountId },
                        });
                    }
                }
            } catch (notifErr) {
                console.error('Message push notification error:', notifErr);
            }
        })();

        return response;

    } catch (error) {
        console.error('Messages POST error:', error);
        return NextResponse.json({ success: false, error: 'Mesaj gönderilemedi' }, { status: 500 });
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
