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

// POST /api/mobile/transactions - Create new transaction (Admin only)
export async function POST(request: NextRequest) {
    try {
        const rateLimited = await rateLimitMiddleware(request, 'api');
        if (rateLimited) return rateLimited;

        const session = await verifyMobileSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'Yetkilendirme gerekli' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { accountId, type, amount, description, date } = body;

        if (!accountId || !type || !amount) {
            return NextResponse.json(
                { success: false, error: 'accountId, type ve amount gereklidir' },
                { status: 400 }
            );
        }

        if (!['Debt', 'Payment'].includes(type)) {
            return NextResponse.json(
                { success: false, error: 'Geçersiz işlem tipi' },
                { status: 400 }
            );
        }

        const transactions = await getTransactionsCollection();
        const doc = {
            accountId: String(accountId),
            type: type as 'Debt' | 'Payment',
            amount: Number(amount),
            description: description || '',
            date: date || new Date().toISOString().split('T')[0],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await transactions.insertOne(doc);

        return NextResponse.json({
            success: true,
            transaction: { ...doc, id: result.insertedId.toString() },
        });
    } catch (error) {
        console.error('Mobile transactions POST error:', error);
        return NextResponse.json(
            { success: false, error: 'İşlem oluşturulamadı' },
            { status: 500 }
        );
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
