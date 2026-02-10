import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { getAccountsCollection, getTransactionsCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * GET /api/client/me - Get current client's account data
 * Uses session cookie for auth (no admin required)
 */
export async function GET() {
    try {
        const session = await verifySession();

        if (!session.authenticated || !session.userId) {
            return NextResponse.json(
                { error: 'Oturum açmanız gerekiyor' },
                { status: 401 }
            );
        }

        const accounts = await getAccountsCollection();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const account = await accounts.findOne({ _id: new ObjectId(session.userId) } as any);

        if (!account) {
            return NextResponse.json(
                { error: 'Hesap bulunamadı' },
                { status: 404 }
            );
        }

        // Get transactions for this account
        const transactionsCollection = await getTransactionsCollection();
        const transactions = await transactionsCollection
            .find({ accountId: account._id.toString() })
            .sort({ date: -1 })
            .toArray();

        const safeTransactions = transactions.map(t => ({
            id: t._id.toString(),
            accountId: t.accountId,
            type: t.type,
            amount: t.amount,
            description: t.description,
            date: t.date.toISOString(),
        }));

        // Return account data (no sensitive fields)
        return NextResponse.json({
            success: true,
            account: {
                id: account._id.toString(),
                name: account.name,
                company: account.company,
                email: account.email,
                totalDebt: account.totalDebt,
                totalPaid: account.totalPaid,
                balance: account.balance,
                status: account.status,
                briefFormType: account.briefFormType,
                briefStatus: account.briefStatus,
                briefToken: account.briefToken,
                briefResponses: account.briefResponses,
                briefSubmittedAt: account.briefSubmittedAt,
                briefApprovedAt: account.briefApprovedAt,
                transactions: safeTransactions,
            }
        });

    } catch (error) {
        console.error('Client me error:', error);
        return NextResponse.json(
            { error: 'Hesap bilgisi alınamadı' },
            { status: 500 }
        );
    }
}
