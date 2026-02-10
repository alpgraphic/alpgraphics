/**
 * Upload API Routes
 * Handles file upload and deletion for Vercel Blob Storage
 * Note: @vercel/blob package is optional - falls back gracefully
 */

import { NextRequest, NextResponse } from 'next/server';

// Dynamic import to handle missing @vercel/blob package
let vercelBlobDel: ((url: string) => Promise<void>) | null = null;
try {
    const vercelBlob = require('@vercel/blob');
    vercelBlobDel = vercelBlob.del;
} catch {
    console.warn('⚠️ @vercel/blob not installed, delete endpoint disabled');
}

/**
 * DELETE /api/upload/delete
 * Delete a file from Vercel Blob Storage
 */
export async function DELETE(request: NextRequest) {
    try {
        if (!vercelBlobDel) {
            return NextResponse.json(
                { success: false, error: '@vercel/blob not installed' },
                { status: 501 }
            );
        }

        const { url } = await request.json();

        if (!url) {
            return NextResponse.json(
                { success: false, error: 'URL is required' },
                { status: 400 }
            );
        }

        // Delete from Vercel Blob
        await vercelBlobDel(url);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Delete failed'
            },
            { status: 500 }
        );
    }
}
