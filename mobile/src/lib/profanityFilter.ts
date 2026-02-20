/**
 * Turkish + English profanity / slang filter
 * Uses character normalization + leet-speak substitution before matching.
 */

// ─── Normalization ────────────────────────────────────────────────────────────
function normalize(text: string): string {
    return text
        .toLowerCase()
        // Turkish special chars → ASCII equivalents
        .replace(/ı/g, 'i')
        .replace(/ş/g, 's')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/İ/g, 'i')
        .replace(/Ş/g, 's')
        .replace(/Ğ/g, 'g')
        .replace(/Ü/g, 'u')
        .replace(/Ö/g, 'o')
        .replace(/Ç/g, 'c')
        // Leet-speak digits
        .replace(/0/g, 'o')
        .replace(/1/g, 'i')
        .replace(/3/g, 'e')
        .replace(/4/g, 'a')
        .replace(/5/g, 's')
        .replace(/8/g, 'b')
        // Strip non-alphanumeric (spaces, dots, dashes kept)
        .replace(/[^a-z0-9 ]/g, '');
}

// ─── Word list ────────────────────────────────────────────────────────────────
// Pre-normalized (already lowercase, Turkish chars converted)
const BANNED_WORDS: string[] = [
    // Turkish küfürler
    'amk', 'amq', 'am', 'bok', 'boktan',
    'orospu', 'orospucoglu', 'orospucocugu',
    'pic', 'piç', 'piclik',
    'sik', 'sikmek', 'sikik',
    'yarrak', 'yarrак',
    'got', 'göt', 'götlek',
    'ibne', 'ibnelik',
    'kahpe', 'kahpelik',
    'serefsiz', 'serefsize',
    'pezevenk',
    'osnap', 'oç', 'oc',
    'gavat', 'gavatlık',
    'piçlik',
    'amcık', 'amcik',
    'domal', 'domalmak',
    'taşak', 'tasak',
    'hassikter', 'hassiktir',
    'sikter', 'siktir',
    'orspu',
    'puşt', 'pust',
    'orosbpu',
    'salak', // borderline but commonly used as insult
    'gerizekalı', 'geriZekali',
    'aptal',
    'mal',
    'haysiyetsiz',
    // English profanity
    'fuck', 'fucker', 'fucking', 'fucked',
    'shit', 'shitty',
    'bitch', 'bitches',
    'asshole', 'ass',
    'dick', 'cock', 'cunt',
    'pussy',
    'nigger', 'nigga',
    'whore',
    'bastard',
    'fag', 'faggot',
    'retard',
    'idiot',
    'moron',
    'slut',
    'damn', 'dammit',
    'crap',
    'piss',
    'prick',
];

// Pre-normalize the word list once at module load
const NORMALIZED_BANNED = BANNED_WORDS.map(normalize);

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns true if the text contains any banned word/phrase.
 */
export function hasProfanity(text: string): boolean {
    const normalized = normalize(text);
    // Check each word in the normalized text AND the full string
    const words = normalized.split(/\s+/);
    for (const banned of NORMALIZED_BANNED) {
        if (normalized.includes(banned)) return true;
        for (const word of words) {
            if (word === banned) return true;
        }
    }
    return false;
}

/**
 * Validates a username for display on leaderboards.
 * Returns an error string, or null if valid.
 */
export function validateUsername(username: string): string | null {
    const trimmed = username.trim();
    if (trimmed.length < 2) return 'Kullanıcı adı en az 2 karakter olmalı';
    if (trimmed.length > 20) return 'Kullanıcı adı en fazla 20 karakter olabilir';
    if (!/^[a-zA-Z0-9_\-. ğüşıöçĞÜŞİÖÇ]+$/.test(trimmed)) {
        return 'Sadece harf, rakam, boşluk ve _ - . kullanabilirsin';
    }
    if (hasProfanity(trimmed)) return 'Bu kullanıcı adı uygun değil';
    return null;
}
