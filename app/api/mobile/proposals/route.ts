import { NextRequest, NextResponse } from 'next/server';
import { getProposalsCollection } from '@/lib/mongodb';
import { verifyMobileSession } from '@/lib/auth/mobileSession';
import { ObjectId } from 'mongodb';

const ALLOWED_FIELDS = [
    'id', 'title', 'clientName', 'date', 'validUntil', 'items',
    'totalAmount', 'status', 'currency', 'currencySymbol', 'taxRate',
    'logoText', 'logoSubtext', 'notes', 'showKdv', 'useDirectTotal',
];

// GET - List all proposals
export async function GET() {
    try {
        const session = await verifyMobileSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 });
        }

        const collection = await getProposalsCollection();
        const proposals = await collection.find({}).sort({ createdAt: -1 }).toArray();
        return NextResponse.json({ success: true, proposals });
    } catch (error) {
        console.error('Mobile proposals GET error:', error);
        return NextResponse.json({ success: false, error: 'Teklifler alınamadı' }, { status: 500 });
    }
}

// POST - Create new proposal
export async function POST(request: NextRequest) {
    try {
        const session = await verifyMobileSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 });
        }

        const body = await request.json();
        const collection = await getProposalsCollection();

        const doc: Record<string, any> = {
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        for (const key of ALLOWED_FIELDS) {
            if (body[key] !== undefined) doc[key] = body[key];
        }

        const result = await collection.insertOne(doc as any);
        return NextResponse.json({
            success: true,
            proposal: { ...doc, _id: result.insertedId.toString() },
        });
    } catch (error) {
        console.error('Mobile proposals POST error:', error);
        return NextResponse.json({ success: false, error: 'Teklif oluşturulamadı' }, { status: 500 });
    }
}

// PUT - Update proposal
export async function PUT(request: NextRequest) {
    try {
        const session = await verifyMobileSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 });
        }

        const body = await request.json();
        const { _id } = body;
        if (!_id) {
            return NextResponse.json({ error: 'Proposal ID gerekli' }, { status: 400 });
        }

        const collection = await getProposalsCollection();
        const updates: Record<string, any> = { updatedAt: new Date() };
        for (const key of ALLOWED_FIELDS) {
            if (body[key] !== undefined) updates[key] = body[key];
        }

        let result;
        if (ObjectId.isValid(_id) && String(new ObjectId(_id)) === _id) {
            result = await collection.updateOne(
                { _id: new ObjectId(_id) } as any,
                { $set: updates }
            );
        }
        if (!result || result.matchedCount === 0) {
            return NextResponse.json({ error: 'Teklif bulunamadı' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Mobile proposals PUT error:', error);
        return NextResponse.json({ success: false, error: 'Teklif güncellenemedi' }, { status: 500 });
    }
}

// DELETE - Delete proposal
export async function DELETE(request: NextRequest) {
    try {
        const session = await verifyMobileSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: 'ID gerekli' }, { status: 400 });
        }

        const collection = await getProposalsCollection();
        let result;
        if (ObjectId.isValid(id)) {
            result = await collection.deleteOne({ _id: new ObjectId(id) } as any);
        }
        if (!result || result.deletedCount === 0) {
            return NextResponse.json({ error: 'Teklif bulunamadı' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Mobile proposals DELETE error:', error);
        return NextResponse.json({ success: false, error: 'Teklif silinemedi' }, { status: 500 });
    }
}
