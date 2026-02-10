import { NextRequest, NextResponse } from 'next/server';
import { getTransactionsCollection, getAccountsCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { requireAdmin } from '@/lib/auth/session';

// GET transactions (Admin only)
export async function GET(request: NextRequest) {
    try {
        // Auth check
        const auth = await requireAdmin();
        if (!auth.authorized) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const accountId = searchParams.get('accountId');

        const collection = await getTransactionsCollection();
        const query = accountId ? { accountId } : {};

        const transactions = await collection.find(query).sort({ date: -1 }).toArray();

        // Convert _id to string
        const safeTransactions = transactions.map(t => ({
            ...t,
            id: t._id.toString(),
            _id: undefined
        }));

        return NextResponse.json({ transactions: safeTransactions });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }
}

// POST new transaction (Admin only)
export async function POST(request: NextRequest) {
    try {
        // Auth check
        const auth = await requireAdmin();
        if (!auth.authorized) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const body = await request.json();
        const { accountId, type, amount, description, date } = body;

        if (!accountId || !type || !amount) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const transactions = await getTransactionsCollection();
        const accounts = await getAccountsCollection();

        // 1. Create Transaction
        const newTransaction = {
            accountId,
            type,
            amount: parseFloat(amount),
            description: description || '',
            date: new Date(date),
            createdAt: new Date()
        };

        const result = await transactions.insertOne(newTransaction);

        // 2. Update Account Balance
        const accountObjectId = new ObjectId(accountId);

        const updateDoc: any = { $set: { updatedAt: new Date() } };

        if (type === 'Debt') {
            updateDoc.$inc = { totalDebt: parseFloat(amount), balance: parseFloat(amount) };
        } else if (type === 'Payment') {
            updateDoc.$inc = { totalPaid: parseFloat(amount), balance: -parseFloat(amount) };
        }

        await accounts.updateOne(
            { _id: accountObjectId as any },
            updateDoc
        );

        return NextResponse.json({
            success: true,
            transaction: { ...newTransaction, id: result.insertedId.toString() }
        });

    } catch (error) {
        console.error('Transaction error:', error);
        return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }
}
