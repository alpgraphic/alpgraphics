import { NextRequest, NextResponse } from 'next/server';
import { getAccountsCollection, getTransactionsCollection, getProjectsCollection } from '@/lib/mongodb';
import { rateLimitMiddleware } from '@/lib/security/rateLimit';
import { verifyMobileSession } from '@/lib/auth/mobileSession';

// GET /api/mobile/dashboard - Admin dashboard stats
export async function GET(request: NextRequest) {
    try {
        // Rate limiting
        const rateLimited = await rateLimitMiddleware(request, 'api');
        if (rateLimited) return rateLimited;

        // Verify session against DB
        const session = await verifyMobileSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'Admin yetkisi gerekli' },
                { status: 403 }
            );
        }

        const [accounts, transactions, projects] = await Promise.all([
            getAccountsCollection(),
            getTransactionsCollection(),
            getProjectsCollection(),
        ]);

        // Aggregate stats
        const [
            totalAccounts,
            allAccounts,
            allTransactions,
            totalProjects,
        ] = await Promise.all([
            accounts.countDocuments({ role: { $ne: 'admin' } }),
            accounts.find({ role: { $ne: 'admin' } }).toArray(),
            transactions.find({}).sort({ date: -1 }).toArray(),
            projects.countDocuments({}),
        ]);

        // Calculate financial stats
        let totalRevenue = 0;
        let totalExpenses = 0;
        let pendingPayments = 0;

        for (const t of allTransactions) {
            if (t.type === 'Payment') {
                totalRevenue += t.amount || 0;
            } else if (t.type === 'Debt') {
                totalExpenses += t.amount || 0;
            }
        }

        // Count brief statuses
        let pendingBriefs = 0;
        let activeBriefs = 0;
        for (const acc of allAccounts) {
            if (acc.briefStatus === 'submitted') pendingBriefs++;
            if (acc.briefStatus === 'approved') activeBriefs++;
            pendingPayments += (acc.balance || 0);
        }

        // Recent activity (last 5 transactions)
        const recentActivity = allTransactions.slice(0, 5).map(t => ({
            id: t._id?.toString(),
            type: t.type,
            amount: t.amount,
            description: t.description,
            date: t.date,
            accountId: t.accountId,
        }));

        // Find account names for recent activity
        const accountMap: Record<string, string> = {};
        for (const acc of allAccounts) {
            accountMap[acc._id!.toString()] = acc.company || acc.name || 'Bilinmeyen';
        }

        const activityWithNames = recentActivity.map(a => ({
            ...a,
            accountName: accountMap[a.accountId] || 'Bilinmeyen',
        }));

        return NextResponse.json({
            success: true,
            data: {
                stats: {
                    totalAccounts,
                    totalProjects,
                    pendingBriefs,
                    activeBriefs,
                    totalRevenue,
                    totalExpenses,
                    profit: totalRevenue - totalExpenses,
                    pendingPayments,
                },
                recentActivity: activityWithNames,
            },
        });

    } catch (error) {
        console.error('Mobile dashboard error:', error);
        return NextResponse.json(
            { success: false, error: 'Dashboard verisi alınamadı' },
            { status: 500 }
        );
    }
}
