/**
 * Server-side Turkish + English profanity filter (shared with mobile client)
 */

function normalize(text: string): string {
    return text
        .toLowerCase()
        .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
        .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/İ/g, 'i').replace(/Ş/g, 's').replace(/Ğ/g, 'g')
        .replace(/Ü/g, 'u').replace(/Ö/g, 'o').replace(/Ç/g, 'c')
        .replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e')
        .replace(/4/g, 'a').replace(/5/g, 's').replace(/8/g, 'b')
        .replace(/[^a-z0-9 ]/g, '');
}

const BANNED_WORDS = [
    'amk','amq','am','bok','boktan','orospu','orospucoglu','orospucocugu',
    'pic','pic','piclik','sik','sikmek','sikik','yarrak','got','got','gotlek',
    'ibne','ibnelik','kahpe','kahpelik','serefsiz','serefsize','pezevenk',
    'osnap','oc','oc','gavat','gavatlik','piclik','amcik','amcik','domal',
    'domalmak','tasak','tasak','hassikter','hassiktir','sikter','siktir',
    'orspu','pust','pust','orosbpu','salak','geriZekali','aptal','mal',
    'haysiyetsiz','fuck','fucker','fucking','fucked','shit','shitty',
    'bitch','bitches','asshole','ass','dick','cock','cunt','pussy',
    'nigger','nigga','whore','bastard','fag','faggot','retard','idiot',
    'moron','slut','damn','dammit','crap','piss','prick',
].map(normalize);

export function hasProfanity(text: string): boolean {
    const n = normalize(text);
    return BANNED_WORDS.some(w => n.includes(w));
}

export function validateUsername(username: string): string | null {
    const t = username.trim();
    if (t.length < 2) return 'Kullanıcı adı en az 2 karakter olmalı';
    if (t.length > 20) return 'Kullanıcı adı en fazla 20 karakter olabilir';
    if (!/^[a-zA-Z0-9_\-. ğüşıöçĞÜŞİÖÇ]+$/.test(t)) {
        return 'Sadece harf, rakam, boşluk ve _ - . kullanabilirsin';
    }
    if (hasProfanity(t)) return 'Bu kullanıcı adı uygun değil';
    return null;
}
