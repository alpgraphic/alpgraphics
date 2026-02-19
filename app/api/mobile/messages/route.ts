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
                const messages = await col
                    .find({ accountId })
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

            // Get all conversation summaries
            const pipeline = [
                { $sort: { createdAt: -1 } },
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
                { $sort: { lastCreatedAt: -1 } },
            ];

            const conversations = await col.aggregate(pipeline as any[]).toArray();

            // Enrich with account names
            const { getAccountsCollection } = await import('@/lib/mongodb');
            const accounts = await getAccountsCollection();
            const { ObjectId } = await import('mongodb');

            const enriched = await Promise.all(
                conversations.map(async conv => {
                    let accountName = conv._id;
                    let companyName = conv._id;
                    try {
                        const acc = ObjectId.isValid(conv._id)
                            ? await accounts.findOne({ _id: new ObjectId(conv._id) } as any)
                            : null;
                        if (acc) {
                            accountName = acc.name;
                            companyName = (acc as any).company || acc.name;
                        }
                    } catch {}
                    return {
                        accountId: conv._id,
                        accountName,
                        companyName,
                        lastMessage: conv.lastMessage,
                        lastSenderRole: conv.lastSenderRole,
                        lastCreatedAt: conv.lastCreatedAt,
                        unreadCount: conv.unreadCount,
                    };
                })
            );

            return NextResponse.json({ success: true, data: enriched });
        }

        // Client: own conversation
        const clientAccountId = session.userId;
        const messages = await col
            .find({ accountId: clientAccountId })
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

        // Push notification to recipient
        try {
            if (session.role === 'client') {
                // Notify admin
                const adminTokens = await getAdminTokens();
                if (adminTokens.length > 0) {
                    await sendPushNotification(adminTokens, {
                        title: `${senderName} mesaj gönderdi`,
                        body: content.trim().substring(0, 100),
                        data: { type: 'message', accountId: resolvedAccountId },
                    });
                }
            } else {
                // Notify client
                const clientTokens = await getTokensForUser(resolvedAccountId);
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

        return NextResponse.json({
            success: true,
            message: {
                id: result.insertedId.toString(),
                ...message,
            },
        });

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
