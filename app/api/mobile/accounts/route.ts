import { NextRequest, NextResponse } from 'next/server';
import { getAccountsCollection } from '@/lib/mongodb';
import { rateLimitMiddleware } from '@/lib/security/rateLimit';
import { verifyMobileSession } from '@/lib/auth/mobileSession';

// GET /api/mobile/accounts - Get accounts (admin: all, client: own)
export async function GET(request: NextRequest) {
    try {
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

        const accounts = await getAccountsCollection();
        const { ObjectId } = await import('mongodb');

        // Admin: return all client accounts
        if (role === 'admin') {
            const allAccounts = await accounts
                .find({ role: { $ne: 'admin' } })
                .sort({ createdAt: -1 })
                .toArray();

            return NextResponse.json({
                success: true,
                data: allAccounts.map(acc => ({
                    id: acc._id?.toString(),
                    name: acc.name,
                    company: acc.company,
                    email: acc.email,
                    balance: acc.balance || 0,
                    totalDebt: acc.totalDebt || 0,
                    totalPaid: acc.totalPaid || 0,
                    briefStatus: acc.briefStatus,
                    briefFormType: acc.briefFormType,
                    createdAt: acc.createdAt,
                })),
            });
        }

        // Client: return own account only

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const account = await accounts.findOne({ _id: new ObjectId(clientId) } as any);

        if (!account) {
            return NextResponse.json(
                { success: false, error: 'Hesap bulunamadı' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                id: account._id?.toString(),
                name: account.name,
                company: account.company,
                email: account.email,
                balance: account.balance || 0,
                totalDebt: account.totalDebt || 0,
                totalPaid: account.totalPaid || 0,
                briefStatus: account.briefStatus,
                briefFormType: account.briefFormType,
                createdAt: account.createdAt,
            }
        });

    } catch (error) {
        console.error('Get accounts error:', error);
        return NextResponse.json(
            { success: false, error: 'Hesap bilgisi alınamadı' },
            { status: 500 }
        );
    }
}

// PUT /api/mobile/accounts - Update current user's account
export async function PUT(request: NextRequest) {
    try {
        // DB-backed session verification
        const session = await verifyMobileSession();
        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Yetkilendirme gerekli' },
                { status: 401 }
            );
        }

        const clientId = session.userId;

        const body = await request.json();
        const { name, company } = body;

        const accounts = await getAccountsCollection();
        const { ObjectId } = await import('mongodb');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await accounts.updateOne(
            { _id: new ObjectId(clientId) } as any,
            {
                $set: {
                    ...(name && { name }),
                    ...(company && { company }),
                    updatedAt: new Date(),
                }
            }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { success: false, error: 'Hesap bulunamadı' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Hesap güncellendi',
        });

    } catch (error) {
        console.error('Update account error:', error);
        return NextResponse.json(
            { success: false, error: 'Hesap güncellenemedi' },
            { status: 500 }
        );
    }
}
