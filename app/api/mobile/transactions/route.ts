import { NextRequest, NextResponse } from 'next/server';
import { getTransactionsCollection } from '@/lib/mongodb';
import { rateLimitMiddleware } from '@/lib/security/rateLimit';
import { verifyMobileSession } from '@/lib/auth/mobileSession';

// GET /api/mobile/transactions - Get transactions for authenticated user
export async function GET(request: NextRequest) {
    try {
        // Rate limiting
        const rateLimited = await rateLimitMiddleware(request, 'api');
        if (rateLimited) return rateLimited;

        // DB-backed session verification
        const session = await verifyMobileSession();
        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Yetkilendirme gerekli' },
                { status: 401 }
            );
        }

        const { userId: clientId, role } = session;

        const transactions = await getTransactionsCollection();

        if (role === 'admin') {
            // Admin: can filter by accountId or see all
            const { searchParams } = new URL(request.url);
            const accountId = searchParams.get('accountId');

            const query = accountId ? { accountId } : {};
            const allTransactions = await transactions
                .find(query)
                .sort({ date: -1 })
                .limit(100)
                .toArray();

            return NextResponse.json({
                success: true,
                data: allTransactions.map(t => ({
                    id: t._id?.toString(),
                    accountId: t.accountId,
                    type: t.type,
                    amount: t.amount,
                    description: t.description,
                    date: t.date,
                    createdAt: t.createdAt,
                })),
            });
        }

        // Client: only see their own transactions
        const clientTransactions = await transactions
            .find({ accountId: clientId })
            .sort({ date: -1 })
            .limit(50)
            .toArray();

        return NextResponse.json({
            success: true,
            data: clientTransactions.map(t => ({
                id: t._id?.toString(),
                type: t.type,
                amount: t.amount,
                description: t.description,
                date: t.date,
            })),
        });

    } catch (error) {
        console.error('Mobile transactions error:', error);
        return NextResponse.json(
            { success: false, error: 'İşlemler alınamadı' },
            { status: 500 }
        );
    }
}
