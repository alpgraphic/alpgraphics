import { NextRequest, NextResponse } from 'next/server';
import { getGameScoresCollection } from '@/lib/mongodb';
import { rateLimitMiddleware, checkRateLimit, getClientIP } from '@/lib/security/rateLimit';
import { validateUsername } from '@/lib/profanity';

const GAME_ID = 'chroma_dash';
const LEADERBOARD_LIMIT = 20;

// ─── CORS helper ──────────────────────────────────────────────────────────────
function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    };
}

// ─── GET /api/mobile/game/scores?game=chroma_dash ─────────────────────────────
// Public — no auth required
export async function GET(request: NextRequest) {
    try {
        const rateLimited = await rateLimitMiddleware(request, 'public');
        if (rateLimited) return rateLimited;

        const col = await getGameScoresCollection();
        const entries = await col
            .find({ game: GAME_ID })
            .sort({ score: -1 })
            .limit(LEADERBOARD_LIMIT)
            .toArray();

        const leaderboard = entries.map((e, i) => ({
            rank:     i + 1,
            username: e.username,
            score:    e.score,
        }));

        return NextResponse.json(
            { success: true, leaderboard },
            { headers: corsHeaders() }
        );
    } catch (error) {
        console.error('Game scores GET error:', error);
        return NextResponse.json(
            { success: false, error: 'Liderlik tablosu alınamadı' },
            { status: 500, headers: corsHeaders() }
        );
    }
}

// ─── POST /api/mobile/game/scores ─────────────────────────────────────────────
// Body: { username: string, score: number }
// No auth — but rate-limited (auth tier = 10 req / 15 min per IP)
export async function POST(request: NextRequest) {
    try {
        // Strict rate limit for score submissions
        const ip = getClientIP(request);
        const rl = await checkRateLimit(ip, '/api/mobile/game/scores/post', 'auth');
        if (!rl.allowed) {
            return NextResponse.json(
                { success: false, error: 'Çok fazla istek. Lütfen bekleyin.' },
                { status: 429, headers: corsHeaders() }
            );
        }

        const body = await request.json().catch(() => null);
        if (!body || typeof body !== 'object') {
            return NextResponse.json(
                { success: false, error: 'Geçersiz istek gövdesi' },
                { status: 400, headers: corsHeaders() }
            );
        }

        const { username, score } = body as { username?: unknown; score?: unknown };

        // Validate username
        if (typeof username !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Kullanıcı adı gerekli' },
                { status: 400, headers: corsHeaders() }
            );
        }

        const usernameError = validateUsername(username);
        if (usernameError) {
            return NextResponse.json(
                { success: false, error: usernameError },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Validate score
        if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 9999) {
            return NextResponse.json(
                { success: false, error: 'Geçersiz skor' },
                { status: 400, headers: corsHeaders() }
            );
        }

        const normalizedUsername = username.trim().toLowerCase();
        const now = new Date();
        const col = await getGameScoresCollection();

        // Upsert: only update score if new score is strictly higher
        const existing = await col.findOne({ game: GAME_ID, username: normalizedUsername });

        if (!existing) {
            // New player — insert
            await col.insertOne({
                game:      GAME_ID,
                username:  normalizedUsername,
                score,
                createdAt: now,
                updatedAt: now,
            });
        } else if (score > existing.score) {
            // Beat their own best — update
            await col.updateOne(
                { game: GAME_ID, username: normalizedUsername },
                { $set: { score, updatedAt: now } }
            );
        }
        // If score <= existing.score, do nothing — leaderboard unchanged

        // Return updated top-20 so the client can refresh in one round-trip
        const entries = await col
            .find({ game: GAME_ID })
            .sort({ score: -1 })
            .limit(LEADERBOARD_LIMIT)
            .toArray();

        const leaderboard = entries.map((e, i) => ({
            rank:     i + 1,
            username: e.username,
            score:    e.score,
        }));

        return NextResponse.json(
            { success: true, leaderboard },
            { headers: corsHeaders() }
        );
    } catch (error) {
        console.error('Game scores POST error:', error);
        return NextResponse.json(
            { success: false, error: 'Skor kaydedilemedi' },
            { status: 500, headers: corsHeaders() }
        );
    }
}

// ─── OPTIONS — CORS preflight ─────────────────────────────────────────────────
export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: corsHeaders() });
}
