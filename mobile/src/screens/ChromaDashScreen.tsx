/**
 * Chroma Dash v4 — Gerçek Veritabanı Liderlik Tablosu
 *
 * Takım arkadaşlarınla yarış, kupa kazan, unvan yükselt.
 * Geometry Dash × Color Switch mekanik harmanlama.
 * Skorlar MongoDB'ye kaydedilir; liderlik tablosu gerçek zamanlı.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableWithoutFeedback,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Dimensions,
    StatusBar,
    Animated,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { SPACING, API_BASE_URL } from '../lib/constants';
import { validateUsername } from '../lib/profanityFilter';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Band    { color: string; y: number; h: number }
interface Obs     { id: number; x: number; bands: Band[]; safeColor: string; passed: boolean }
interface Orb     { id: number; x: number; y: number; color: string }
interface LBEntry { score: number; rankLabel: string }

interface GlobalLBEntry {
    rank:     number;
    username: string;
    score:    number;
}

interface GS {
    phase:         Phase;
    cubeY:         number;
    cubeVY:        number;
    colorIdx:      number;
    obstacles:     Obs[];
    orbs:          Orb[];
    score:         number;
    speed:         number;
    ticks:         number;
    nextId:        number;
    playH:         number;
    orbsCollected: number;
}

interface Stats {
    totalGames: number;
    maxScore:   number;
    totalOrbs:  number;
}

interface MixedEntry {
    name:     string;
    score:    number;
    isPlayer: boolean;
}

type Phase = 'idle' | 'countdown' | 'playing' | 'dead';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'ChromaDash'>;
};

// ─── Sabitler ─────────────────────────────────────────────────────────────────

const { width: SW, height: SH } = Dimensions.get('window');

const NEONS: readonly string[] = ['#00e5ff', '#ff2d78', '#ffe000', '#39ff6a'];
const NAMES: readonly string[] = ['SİYAN', 'PEMBE', 'SARI', 'YEŞİL'];
const BG       = '#080810';
const CUBE_W   = 24;
const CUBE_X   = 72;
const GRAVITY  = 0.42;
const JUMP_V   = -9.2;
const BASE_SPD = 3.8;
const OBS_W    = 20;
const OBS_GAP  = 280;
const BANDS    = 3;
const ORB_R    = 13;

const LB_KEY      = 'chroma_dash_lb_v1';
const LB_MAX      = 5;
const USERNAME_KEY = 'chroma_dash_username_v1';
const TROPHY_KEY   = 'chroma_dash_trophies_v1';
const STATS_KEY    = 'chroma_dash_stats_v1';

// ─── Kupa Sistemi ─────────────────────────────────────────────────────────────

interface TrophyDef {
    id:    string;
    emoji: string;
    name:  string;
    desc:  string;
    check: (score: number, stats: Stats) => boolean;
}

const TROPHIES: TrophyDef[] = [
    { id: 'start',      emoji: '🎮', name: 'İlk Adım',     desc: 'İlk oyununu oyna',            check: (_s, st) => st.totalGames >= 1  },
    { id: 'designer',   emoji: '🖊️',  name: 'Tasarımcı',   desc: '12+ puan al',                  check: (s)       => s >= 12            },
    { id: 'senior',     emoji: '🎨', name: 'Kıdemli',      desc: '22+ puan al',                  check: (s)       => s >= 22            },
    { id: 'director',   emoji: '⭐', name: 'Direktör',     desc: '35+ puan al',                  check: (s)       => s >= 35            },
    { id: 'god',        emoji: '🌈', name: 'Renk Tanrısı', desc: '50+ puan al',                  check: (s)       => s >= 50            },
    { id: 'veteran',    emoji: '🔥', name: 'Veteran',      desc: '10 kez oyna',                  check: (_s, st) => st.totalGames >= 10 },
    { id: 'orbmaster',  emoji: '💫', name: 'Orb Ustası',   desc: 'Toplam 30 orb topla',          check: (_s, st) => st.totalOrbs >= 30  },
    { id: 'top3',       emoji: '🏆', name: 'Podiyum',      desc: 'Liderlik tablosunda ilk 3\'e gir', check: (_s, st) => st.maxScore >= 1 },
];

// ─── Unvan Sistemi ────────────────────────────────────────────────────────────

const RANKS = [
    { min: 0,  label: 'Stajyer',           emoji: '📋', color: '#6b7280' },
    { min: 5,  label: 'Asistan Tasarımcı', emoji: '✏️',  color: '#ca8a04' },
    { min: 12, label: 'Tasarımcı',         emoji: '🖊️',  color: '#3b82f6' },
    { min: 22, label: 'Kıdemli Tasarımcı', emoji: '🎨',  color: '#8b5cf6' },
    { min: 35, label: 'Direktör',          emoji: '⭐',  color: '#ff2d78' },
    { min: 50, label: 'Renk Tanrısı',      emoji: '🌈',  color: '#ffe000' },
];

function getRank(score: number) {
    let r = RANKS[0];
    for (const rank of RANKS) { if (score >= rank.min) r = rank; else break; }
    return r;
}
function getNextRank(score: number) {
    for (const rank of RANKS) { if (score < rank.min) return rank; }
    return null;
}
function rankProgress(score: number): number {
    const cur  = getRank(score);
    const next = getNextRank(score);
    if (!next) return 1;
    return Math.min(1, (score - cur.min) / (next.min - cur.min));
}

// Build display LB: merge globalLB with player's current score, highlight player
function buildMixedLB(
    playerName: string,
    playerScore: number,
    globalLB: GlobalLBEntry[]
): MixedEntry[] {
    const playerNameLower = playerName.toLowerCase();

    // Remove player's existing entry from global LB (we'll re-insert with current score)
    const others = globalLB
        .filter(e => e.username.toLowerCase() !== playerNameLower)
        .map(e => ({ name: e.username, score: e.score, isPlayer: false }));

    const all: MixedEntry[] = [
        ...others,
        { name: playerName, score: playerScore, isPlayer: true },
    ];

    return all.sort((a, b) => b.score - a.score);
}

// ─── Yardımcılar ──────────────────────────────────────────────────────────────

function rnd(n: number) { return Math.floor(Math.random() * n); }

function makeBands(safeColorIdx: number, playH: number, safeBandPos?: number): Band[] {
    const h    = playH / BANDS;
    const idxs: number[] = [safeColorIdx];
    while (idxs.length < BANDS) {
        const n = rnd(NEONS.length);
        if (!idxs.includes(n)) idxs.push(n);
    }
    if (safeBandPos !== undefined) {
        idxs.splice(idxs.indexOf(safeColorIdx), 1);
        idxs.splice(safeBandPos, 0, safeColorIdx);
    } else {
        for (let i = idxs.length - 1; i > 0; i--) {
            const j = rnd(i + 1);
            [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
        }
    }
    return idxs.map((ci, i) => ({ color: NEONS[ci], y: i * h, h }));
}

function spawnObs(gs: GS, x: number, forceMid = false): Obs {
    return {
        id: gs.nextId++, x,
        bands:     makeBands(gs.colorIdx, gs.playH, forceMid ? 1 : undefined),
        safeColor: NEONS[gs.colorIdx],
        passed:    false,
    };
}

function spawnOrb(gs: GS, x: number): Orb {
    let ci = rnd(NEONS.length);
    while (ci === gs.colorIdx) ci = rnd(NEONS.length);
    const bandH = gs.playH / BANDS;
    const y = bandH * 0.4 + Math.random() * (gs.playH - bandH * 0.8);
    return { id: gs.nextId++, x, y, color: NEONS[ci] };
}

function patchNextObs(gs: GS, newColorIdx: number) {
    const newColor = NEONS[newColorIdx];
    const next = gs.obstacles.find(o => !o.passed && o.x > CUBE_X + CUBE_W);
    if (!next) return;
    next.safeColor = newColor;
    if (!next.bands.some(b => b.color === newColor)) {
        next.bands[rnd(BANDS)].color = newColor;
    }
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────

export default function ChromaDashScreen({ navigation }: Props) {
    const insets  = useSafeAreaInsets();
    const headerH = insets.top + 52;
    const footerH = insets.bottom + 48;
    const playH   = Math.max(200, SH - headerH - footerH);

    // Temel UI state
    const [,               setTick]          = useState(0);
    const [leaderboard,    setLeaderboard]   = useState<LBEntry[]>([]);
    const [globalLB,       setGlobalLB]      = useState<GlobalLBEntry[]>([]);
    const [lbLoading,      setLbLoading]     = useState(false);
    const [countdown,      setCountdown]     = useState(3);
    const [username,       setUsername]      = useState<string | null>(null);
    const [usernameInput,  setUsernameInput] = useState('');
    const [usernameError,  setUsernameError] = useState<string | null>(null);
    const [earnedTrophies, setEarnedTrophies]= useState<Set<string>>(new Set());
    const [stats,          setStats]         = useState<Stats>({ totalGames: 0, maxScore: 0, totalOrbs: 0 });
    const [newTrophies,    setNewTrophies]   = useState<TrophyDef[]>([]);

    // Ölüm ekranı için zenginleştirilmiş state
    const [displayScore,   setDisplayScore]  = useState(0);
    const [isNewRecord,    setIsNewRecord]   = useState(false);
    const [beatenRival,    setBeatenRival]   = useState<string | null>(null);
    const [lbPosition,     setLbPosition]   = useState(0);

    // Refs
    const rafRef        = useRef<number | null>(null);
    const cdTimerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
    const scoreTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const cdAnim        = useRef(new Animated.Value(1)).current;
    const newRecordAnim = useRef(new Animated.Value(0)).current;

    const gsRef = useRef<GS>({
        phase: 'idle', cubeY: 0, cubeVY: 0, colorIdx: 0,
        obstacles: [], orbs: [], score: 0,
        speed: BASE_SPD, ticks: 0, nextId: 0, playH,
        orbsCollected: 0,
    });
    gsRef.current.playH = playH;

    // ── Global LB çekme ───────────────────────────────────────────────────────

    const fetchLeaderboard = useCallback(async () => {
        setLbLoading(true);
        try {
            const res  = await fetch(`${API_BASE_URL}/api/mobile/game/scores`);
            const data = await res.json();
            if (data.success && Array.isArray(data.leaderboard)) {
                setGlobalLB(data.leaderboard);
            }
        } catch { /* sessiz hata */ }
        finally { setLbLoading(false); }
    }, []);

    // ── Skor gönderme ─────────────────────────────────────────────────────────

    const submitScore = useCallback(async (score: number, uname: string) => {
        if (!uname || score <= 0) return;
        try {
            const res  = await fetch(`${API_BASE_URL}/api/mobile/game/scores`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ username: uname, score }),
            });
            const data = await res.json();
            if (data.success && Array.isArray(data.leaderboard)) {
                setGlobalLB(data.leaderboard);
            }
        } catch { /* sessiz hata */ }
    }, []);

    // ── İlk yükleme ───────────────────────────────────────────────────────────

    useEffect(() => {
        (async () => {
            try {
                const name = await SecureStore.getItemAsync(USERNAME_KEY);
                if (name) setUsername(name);
                const lb = await SecureStore.getItemAsync(LB_KEY);
                if (lb) setLeaderboard(JSON.parse(lb) as LBEntry[]);
                const tr = await SecureStore.getItemAsync(TROPHY_KEY);
                if (tr) setEarnedTrophies(new Set(JSON.parse(tr) as string[]));
                const st = await SecureStore.getItemAsync(STATS_KEY);
                if (st) setStats(JSON.parse(st) as Stats);
            } catch { /* sessiz */ }
        })();
        // Global LB'yi API'dan çek
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    // ── Kullanıcı adı kaydet ──────────────────────────────────────────────────

    const confirmUsername = useCallback(async () => {
        const raw  = usernameInput.trim();
        // Normalize: boşlukları alt çizgiyle değiştir, küçük harf
        const name = raw.toLowerCase().replace(/\s+/g, '_');
        if (!name) return;

        const err = validateUsername(name);
        if (err) { setUsernameError(err); return; }
        setUsernameError(null);

        setUsername(name);
        await SecureStore.setItemAsync(USERNAME_KEY, name).catch(() => {});
    }, [usernameInput]);

    // ── Temizlik ──────────────────────────────────────────────────────────────

    useEffect(() => () => {
        if (rafRef.current)        cancelAnimationFrame(rafRef.current);
        if (cdTimerRef.current)    clearInterval(cdTimerRef.current);
        if (scoreTimerRef.current) clearInterval(scoreTimerRef.current);
    }, []);

    const render = useCallback(() => setTick(t => t + 1), []);

    // ── Skor animasyonu (ölüm ekranı) ─────────────────────────────────────────

    const animateScore = useCallback((target: number) => {
        if (scoreTimerRef.current) clearInterval(scoreTimerRef.current);
        if (target === 0) { setDisplayScore(0); return; }
        setDisplayScore(0);
        const steps  = 28;
        const delay  = 900 / steps;
        let current  = 0;
        scoreTimerRef.current = setInterval(() => {
            current++;
            const t     = current / steps;
            const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            setDisplayScore(Math.round(eased * target));
            if (current >= steps) {
                clearInterval(scoreTimerRef.current!);
                setDisplayScore(target);
            }
        }, delay);
    }, []);

    // ── Ölüm ──────────────────────────────────────────────────────────────────

    const die = useCallback(async (gs: GS) => {
        gs.phase = 'dead';
        if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }

        // Skor animasyonu başlat
        animateScore(gs.score);

        // Stats güncelle
        const prevStats = await SecureStore.getItemAsync(STATS_KEY)
            .then(v => v ? JSON.parse(v) as Stats : { totalGames: 0, maxScore: 0, totalOrbs: 0 })
            .catch(()  => ({ totalGames: 0, maxScore: 0, totalOrbs: 0 }));
        const newStats: Stats = {
            totalGames: prevStats.totalGames + 1,
            maxScore:   Math.max(prevStats.maxScore, gs.score),
            totalOrbs:  prevStats.totalOrbs + gs.orbsCollected,
        };
        await SecureStore.setItemAsync(STATS_KEY, JSON.stringify(newStats)).catch(() => {});
        setStats(newStats);

        // Kupa kontrolü
        const prevTrophies = await SecureStore.getItemAsync(TROPHY_KEY)
            .then(v => v ? new Set(JSON.parse(v) as string[]) : new Set<string>())
            .catch(()  => new Set<string>());
        const newlyEarned: TrophyDef[] = [];
        for (const t of TROPHIES) {
            if (!prevTrophies.has(t.id) && t.check(gs.score, newStats)) {
                prevTrophies.add(t.id);
                newlyEarned.push(t);
            }
        }
        if (newlyEarned.length > 0) {
            await SecureStore.setItemAsync(TROPHY_KEY, JSON.stringify([...prevTrophies])).catch(() => {});
            setEarnedTrophies(new Set(prevTrophies));
        }
        setNewTrophies(newlyEarned);

        // Kişisel skor tablosu
        const prevLB = await SecureStore.getItemAsync(LB_KEY)
            .then(v => v ? JSON.parse(v) as LBEntry[] : [])
            .catch(()  => [] as LBEntry[]);
        const newRecord = gs.score > 0 && gs.score > (prevLB[0]?.score ?? 0);
        setIsNewRecord(newRecord);
        if (newRecord) {
            newRecordAnim.setValue(0);
            Animated.spring(newRecordAnim, { toValue: 1, useNativeDriver: true, delay: 600 }).start();
        }
        const newLB = [...prevLB, { score: gs.score, rankLabel: getRank(gs.score).label }]
            .sort((a, b) => b.score - a.score)
            .slice(0, LB_MAX);
        await SecureStore.setItemAsync(LB_KEY, JSON.stringify(newLB)).catch(() => {});
        setLeaderboard(newLB);

        // Geçilen rakip: globalLB'deki en yüksek skoru geçtiğimiz kişi
        // (sadece skor > 0 olan ve bizden farklı kullanıcılar)
        const playerNameLower = (username ?? '').toLowerCase();
        const beaten = [...globalLB]
            .filter(e => e.username.toLowerCase() !== playerNameLower && gs.score > e.score)
            .sort((a, b) => b.score - a.score)[0];
        setBeatenRival(beaten ? beaten.username : null);

        // Skor gönder (async — UI donmadan)
        if (username && gs.score > 0) {
            submitScore(gs.score, username);
        }

        // Karışık tablodaki sıra (mevcut globalLB üzerinden hesapla)
        const mixed = buildMixedLB(username ?? '?', gs.score, globalLB);
        const pos   = mixed.findIndex(e => e.isPlayer) + 1;
        setLbPosition(pos);

        render();
    }, [animateScore, render, username, newRecordAnim, globalLB, submitScore]);

    // ── Oyun döngüsü ──────────────────────────────────────────────────────────

    const gameLoop = useCallback(() => {
        const gs = gsRef.current;
        if (gs.phase !== 'playing') return;

        gs.ticks++;
        gs.cubeVY += GRAVITY;
        gs.cubeY  += gs.cubeVY;

        if (gs.cubeY < -4 || gs.cubeY + CUBE_W > gs.playH + 4) { die(gs); return; }
        gs.cubeY = Math.max(-4, Math.min(gs.playH + 4 - CUBE_W, gs.cubeY));

        for (const o of gs.obstacles) o.x -= gs.speed;
        for (const o of gs.orbs)      o.x -= gs.speed;
        gs.obstacles = gs.obstacles.filter(o => o.x > -OBS_W - 20);
        gs.orbs      = gs.orbs.filter(o => o.x > -ORB_R * 2);

        const rightmost = gs.obstacles.length > 0
            ? Math.max(...gs.obstacles.map(o => o.x)) : SW + 100;
        if (rightmost < SW + OBS_GAP * 0.6) {
            const newX = Math.max(SW + 80, rightmost + OBS_GAP);
            gs.obstacles.push(spawnObs(gs, newX));
            if (gs.obstacles.length % 2 === 0 && gs.obstacles.length > 1) {
                const prev = gs.obstacles[gs.obstacles.length - 2];
                const orbX = prev.x + OBS_GAP * 0.55;
                if (orbX < newX - 50) gs.orbs.push(spawnOrb(gs, orbX));
            }
        }

        const cubeRight  = CUBE_X + CUBE_W;
        const cubeCenter = gs.cubeY + CUBE_W / 2;
        const cubeColor  = NEONS[gs.colorIdx];

        for (const obs of gs.obstacles) {
            if (obs.passed) continue;
            if (obs.x + OBS_W < CUBE_X) {
                obs.passed = true;
                gs.score++;
                gs.speed = BASE_SPD + Math.min(3.5, Math.floor(gs.score / 6) * 0.22);
                continue;
            }
            if (obs.x > cubeRight || obs.x + OBS_W < CUBE_X) continue;
            const band = obs.bands.find(b => cubeCenter >= b.y && cubeCenter < b.y + b.h);
            if (!band || band.color !== cubeColor) { die(gs); return; }
        }

        for (let i = gs.orbs.length - 1; i >= 0; i--) {
            const orb = gs.orbs[i];
            const dx  = Math.abs(orb.x - (CUBE_X + CUBE_W / 2));
            const dy  = Math.abs(orb.y - (gs.cubeY + CUBE_W / 2));
            if (dx < CUBE_W / 2 + ORB_R && dy < CUBE_W / 2 + ORB_R) {
                const newIdx = NEONS.indexOf(orb.color as any);
                gs.colorIdx = newIdx;
                gs.orbs.splice(i, 1);
                gs.orbsCollected++;
                patchNextObs(gs, newIdx);
            }
        }

        render();
        rafRef.current = requestAnimationFrame(gameLoop);
    }, [die, render]);

    // ── Geri sayım ────────────────────────────────────────────────────────────

    const startCountdown = useCallback(() => {
        const gs         = gsRef.current;
        gs.phase         = 'countdown';
        gs.cubeY         = gs.playH / 2 - CUBE_W / 2;
        gs.cubeVY        = 0;
        gs.colorIdx      = 0;
        gs.obstacles     = [];
        gs.orbs          = [];
        gs.score         = 0;
        gs.speed         = BASE_SPD;
        gs.ticks         = 0;
        gs.nextId        = 0;
        gs.orbsCollected = 0;
        for (let i = 0; i < 3; i++) {
            gs.obstacles.push(spawnObs(gs, SW + 200 + i * OBS_GAP, i === 0));
        }
        setCountdown(3);
        setNewTrophies([]);
        setIsNewRecord(false);
        setBeatenRival(null);
        render();

        let count = 3;
        const tickAnim = () => {
            cdAnim.setValue(1);
            Animated.timing(cdAnim, { toValue: 0, duration: 850, useNativeDriver: true }).start();
        };
        tickAnim();
        cdTimerRef.current = setInterval(() => {
            count -= 1;
            setCountdown(count);
            if (count > 0) {
                tickAnim();
            } else {
                clearInterval(cdTimerRef.current!);
                cdTimerRef.current = null;
                gsRef.current.phase = 'playing';
                render();
                rafRef.current = requestAnimationFrame(gameLoop);
            }
        }, 1000);
    }, [gameLoop, render, cdAnim]);

    // ── Dokunma ───────────────────────────────────────────────────────────────

    const handleTap = useCallback(() => {
        const gs = gsRef.current;
        if ((gs.phase === 'idle' || gs.phase === 'dead') && username) {
            startCountdown();
        } else if (gs.phase === 'playing') {
            gs.cubeVY = JUMP_V;
        }
    }, [startCountdown, username]);

    // ── Hesaplamalar ──────────────────────────────────────────────────────────

    const gs          = gsRef.current;
    const cubeColor   = NEONS[gs.colorIdx];
    const colorName   = NAMES[gs.colorIdx];
    const curRank     = getRank(gs.score);
    const nextRank    = getNextRank(gs.score);
    const progress    = rankProgress(gs.score);
    const hiScore     = leaderboard[0]?.score ?? 0;
    const displayName = username ?? '?';

    // İdleRank için: globalLB + player's best
    const mixedIdle = buildMixedLB(displayName, hiScore, globalLB);
    // Ölüm ekranı için: globalLB + bu rundaki skor
    const mixedDead = buildMixedLB(displayName, gs.score, globalLB);

    const medals = ['🥇', '🥈', '🥉', '4.', '5.', '6.', '7.', '8.', '9.', '10.'];

    // LB'yi en fazla 8 satır göster
    const visibleIdle = mixedIdle.slice(0, 8);
    const visibleDead = mixedDead.slice(0, 8);

    // Eğer oyuncu tabloda değilse son satıra ekle (idle)
    const playerInIdle = visibleIdle.some(e => e.isPlayer);
    const playerInDead = visibleDead.some(e => e.isPlayer);

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <View style={s.root}>
            <StatusBar barStyle="light-content" backgroundColor={BG} />

            {/* ── Header ───────────────────────────────────────────────────── */}
            <View style={[s.header, { paddingTop: insets.top + 8, height: headerH }]}>
                <TouchableOpacity
                    onPress={() => {
                        if (rafRef.current)        cancelAnimationFrame(rafRef.current);
                        if (cdTimerRef.current)    clearInterval(cdTimerRef.current);
                        if (scoreTimerRef.current) clearInterval(scoreTimerRef.current);
                        navigation.goBack();
                    }}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                    <Text style={s.backTxt}>← Çık</Text>
                </TouchableOpacity>

                {gs.phase === 'playing' && (
                    <Text style={[s.liveScore, { color: cubeColor }]}>{gs.score}</Text>
                )}

                {hiScore > 0 && (
                    <Text style={s.hiTxt}>🏆 {hiScore}</Text>
                )}
            </View>

            {/* ── Oyun alanı ───────────────────────────────────────────────── */}
            <TouchableWithoutFeedback onPress={handleTap}>
                <View style={[s.play, { height: playH }]}>

                    {/* Arka plan ızgarası */}
                    <View style={StyleSheet.absoluteFill} pointerEvents="none">
                        {[1, 2].map(i => (
                            <View key={i} style={[s.gridH, { top: playH / BANDS * i }]} />
                        ))}
                        {Array.from({ length: 8 }).map((_, i) => (
                            <View key={`v${i}`} style={[s.gridV, { left: (SW / 8) * i }]} />
                        ))}
                    </View>

                    {/* Engeller */}
                    {(gs.phase === 'playing' || gs.phase === 'countdown') &&
                        gs.obstacles.map(obs => (
                            <View key={obs.id} style={[s.obsCol, { left: obs.x, width: OBS_W }]} pointerEvents="none">
                                {obs.bands.map((band, bi) => {
                                    const isSafe = band.color === cubeColor;
                                    return (
                                        <View
                                            key={bi}
                                            style={[s.band, { top: band.y, height: band.h, backgroundColor: band.color, opacity: isSafe ? 1 : 0.16 }]}
                                        >
                                            {isSafe && <View style={[s.safeBorder, { borderColor: band.color }]} />}
                                        </View>
                                    );
                                })}
                            </View>
                        ))
                    }

                    {/* Orlar */}
                    {gs.orbs.map(orb => (
                        <View key={orb.id} style={[s.orb, { left: orb.x - ORB_R, top: orb.y - ORB_R, width: ORB_R * 2, height: ORB_R * 2, borderRadius: ORB_R, backgroundColor: orb.color, shadowColor: orb.color }]} pointerEvents="none" />
                    ))}

                    {/* Küp */}
                    {(gs.phase === 'playing' || gs.phase === 'countdown') && (
                        <View style={[s.cube, { left: CUBE_X, top: gs.cubeY, backgroundColor: cubeColor, shadowColor: cubeColor }]} pointerEvents="none" />
                    )}

                    {/* ══════════════════════════════════════════════════════════
                        KULLANICI ADI GİRİŞİ
                    ══════════════════════════════════════════════════════════ */}
                    {gs.phase === 'idle' && !username && (
                        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={StyleSheet.absoluteFill}>
                            <View style={s.overlayBase} pointerEvents="box-none">
                                <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                                    <View style={s.titleRow}>
                                        <Text style={s.titleA}>CHROMA</Text>
                                        <Text style={s.titleB}>DASH</Text>
                                    </View>
                                    <Text style={s.tagline}>alpgraphics · Renk Algı Yarışması</Text>

                                    <View style={[s.card, { borderColor: 'rgba(0,229,255,0.25)' }]}>
                                        <Text style={[s.cardLabel, { color: '#00e5ff' }]}>TAKIM YARIŞMASINA KATIL</Text>
                                        <Text style={s.cardSub}>Liderlik tablosunda görünecek takma adını seç</Text>
                                        <TextInput
                                            style={[s.usernameInput, usernameError ? { borderColor: '#ff2d78' } : {}]}
                                            value={usernameInput}
                                            onChangeText={t => { setUsernameInput(t); setUsernameError(null); }}
                                            placeholder="takma ad (max 20 karakter)"
                                            placeholderTextColor="rgba(255,255,255,0.2)"
                                            maxLength={20}
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            returnKeyType="done"
                                            onSubmitEditing={confirmUsername}
                                        />
                                        {usernameError && (
                                            <Text style={s.inputError}>{usernameError}</Text>
                                        )}
                                        <TouchableOpacity
                                            style={[s.primaryBtn, !usernameInput.trim() && s.primaryBtnDisabled]}
                                            onPress={confirmUsername}
                                            disabled={!usernameInput.trim()}
                                        >
                                            <Text style={s.primaryBtnTxt}>YARIŞA GİR  →</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Global LB önizleme */}
                                    <View style={s.card}>
                                        <View style={s.cardLabelRow}>
                                            <Text style={s.cardLabel}>MEVCUT LİDERLİK TABLOSU</Text>
                                            {lbLoading && <ActivityIndicator size="small" color="rgba(255,255,255,0.3)" style={{ marginLeft: 'auto' as any }} />}
                                        </View>
                                        {globalLB.length === 0 && !lbLoading && (
                                            <Text style={s.lbEmpty}>Henüz skor yok — ilk sen ol!</Text>
                                        )}
                                        {globalLB.slice(0, 5).map((e, i) => {
                                            const r = getRank(e.score);
                                            return (
                                                <View key={i} style={s.lbRow}>
                                                    <Text style={s.lbMedal}>{medals[i] ?? `${i+1}.`}</Text>
                                                    <Text style={s.lbName}>{e.username}</Text>
                                                    <Text style={[s.lbScore, { color: r.color }]}>{e.score}</Text>
                                                    <Text style={s.lbRankTxt}>{r.emoji}</Text>
                                                </View>
                                            );
                                        })}
                                        <View style={[s.lbRow, s.lbRowSelf]}>
                                            <Text style={s.lbMedal}>?</Text>
                                            <Text style={[s.lbName, s.lbNameSelf]}>sen  👤</Text>
                                            <Text style={[s.lbScore, { color: '#6b7280' }]}>—</Text>
                                            <Text style={s.lbRankTxt}>oynamadın</Text>
                                        </View>
                                    </View>

                                </ScrollView>
                            </View>
                        </KeyboardAvoidingView>
                    )}

                    {/* ══════════════════════════════════════════════════════════
                        BOŞTA EKRANI (kullanıcı adı var)
                    ══════════════════════════════════════════════════════════ */}
                    {gs.phase === 'idle' && !!username && (
                        <View style={s.overlayBase} pointerEvents="box-none">
                            <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

                                <View style={s.titleRow}>
                                    <Text style={s.titleA}>CHROMA</Text>
                                    <Text style={s.titleB}>DASH</Text>
                                </View>
                                <Text style={s.tagline}>alpgraphics · Renk Algı Yarışması</Text>

                                {/* İstatistik satırı */}
                                {stats.totalGames > 0 && (
                                    <View style={s.statsRow}>
                                        <View style={s.statPill}>
                                            <Text style={s.statNum}>{stats.totalGames}</Text>
                                            <Text style={s.statLabel}>oyun</Text>
                                        </View>
                                        <View style={[s.statPill, { borderColor: getRank(stats.maxScore).color + '55' }]}>
                                            <Text style={[s.statNum, { color: getRank(stats.maxScore).color }]}>{stats.maxScore}</Text>
                                            <Text style={s.statLabel}>en iyi</Text>
                                        </View>
                                        <View style={s.statPill}>
                                            <Text style={s.statNum}>{stats.totalOrbs}</Text>
                                            <Text style={s.statLabel}>orb</Text>
                                        </View>
                                    </View>
                                )}

                                {/* Global skor tablosu */}
                                <View style={s.card}>
                                    <View style={s.cardLabelRow}>
                                        <Text style={s.cardLabel}>LİDERLİK TABLOSU</Text>
                                        {lbLoading
                                            ? <ActivityIndicator size="small" color="rgba(255,255,255,0.3)" style={{ marginLeft: 'auto' as any }} />
                                            : <TouchableOpacity onPress={fetchLeaderboard} style={{ marginLeft: 'auto' as any }}>
                                                <Text style={s.refreshTxt}>↻ yenile</Text>
                                              </TouchableOpacity>
                                        }
                                    </View>
                                    {globalLB.length === 0 && !lbLoading && (
                                        <Text style={s.lbEmpty}>Henüz skor yok — ilk sen ol!</Text>
                                    )}
                                    {visibleIdle.map((e, i) => {
                                        const r = getRank(e.score);
                                        return (
                                            <View key={i} style={[s.lbRow, e.isPlayer && s.lbRowSelf]}>
                                                <Text style={s.lbMedal}>{medals[i] ?? `${i+1}.`}</Text>
                                                <Text style={[s.lbName, e.isPlayer && s.lbNameSelf]}>
                                                    {e.name}{e.isPlayer ? '  👤' : ''}
                                                </Text>
                                                <Text style={[s.lbScore, { color: e.score > 0 ? r.color : '#6b7280' }]}>
                                                    {e.score > 0 ? e.score : '—'}
                                                </Text>
                                                <Text style={s.lbRankTxt}>{r.emoji}</Text>
                                            </View>
                                        );
                                    })}
                                    {/* Oyuncu tabloda görünmüyorsa hatırlat */}
                                    {!playerInIdle && hiScore === 0 && (
                                        <View style={[s.lbRow, s.lbRowSelf]}>
                                            <Text style={s.lbMedal}>—</Text>
                                            <Text style={[s.lbName, s.lbNameSelf]}>{displayName}  👤</Text>
                                            <Text style={[s.lbScore, { color: '#6b7280' }]}>0</Text>
                                            <Text style={s.lbRankTxt}>📋</Text>
                                        </View>
                                    )}
                                </View>

                                {/* Kupa rafı */}
                                <View style={s.card}>
                                    <View style={s.cardLabelRow}>
                                        <Text style={s.cardLabel}>KUPALAR</Text>
                                        <Text style={s.cardLabelBadge}>{earnedTrophies.size}/{TROPHIES.length}</Text>
                                    </View>
                                    <View style={s.trophyGrid}>
                                        {TROPHIES.map(t => {
                                            const earned = earnedTrophies.has(t.id);
                                            return (
                                                <View key={t.id} style={[s.trophySlot, earned ? s.trophyEarned : s.trophyLocked]}>
                                                    <Text style={[s.trophyEmoji, !earned && { opacity: 0.15 }]}>{t.emoji}</Text>
                                                    <Text style={[s.trophyName, !earned && { opacity: 0.18 }]}>
                                                        {earned ? t.name : '???'}
                                                    </Text>
                                                    {earned && <Text style={s.trophyDesc}>{t.desc}</Text>}
                                                </View>
                                            );
                                        })}
                                    </View>
                                </View>

                                {/* Başla butonu */}
                                <TouchableOpacity style={s.primaryBtn} onPress={startCountdown}>
                                    <Text style={s.primaryBtnTxt}>BAŞLA  ▶</Text>
                                </TouchableOpacity>
                                <Text style={s.orTapHint}>veya herhangi bir yere dokun</Text>

                            </ScrollView>
                        </View>
                    )}

                    {/* ══════════════════════════════════════════════════════════
                        GERİ SAYIM
                    ══════════════════════════════════════════════════════════ */}
                    {gs.phase === 'countdown' && (
                        <View style={s.cdOverlay} pointerEvents="none">
                            <View style={[s.cdColorHint, { borderColor: cubeColor }]}>
                                <View style={[s.cdCube, { backgroundColor: cubeColor, shadowColor: cubeColor }]} />
                                <Text style={[s.cdHintTxt, { color: cubeColor }]}>{colorName} BÖLGEDEN GEÇ</Text>
                            </View>
                            <Animated.Text style={[
                                s.cdNum,
                                {
                                    opacity: cdAnim,
                                    transform: [{ scale: cdAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.3] }) }],
                                },
                            ]}>
                                {countdown > 0 ? countdown : 'GİT!'}
                            </Animated.Text>
                            <Text style={s.cdSubHint}>Tap → Zıpla   ·   Zemin & Tavan = Ölüm</Text>
                        </View>
                    )}

                    {/* ══════════════════════════════════════════════════════════
                        ÖLÜM EKRANI
                    ══════════════════════════════════════════════════════════ */}
                    {gs.phase === 'dead' && (
                        <View style={s.overlayBase} pointerEvents="box-none">
                            <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

                                {/* Skor + yeni rekor */}
                                <View style={s.deadScoreRow}>
                                    <Text style={[s.deadNum, { color: curRank.color }]}>{displayScore}</Text>
                                    {isNewRecord && (
                                        <Animated.View style={[s.newRecordBadge, { transform: [{ scale: newRecordAnim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.3, 1.2, 1] }) }], opacity: newRecordAnim }]}>
                                            <Text style={s.newRecordTxt}>🌟 YENİ REKOR</Text>
                                        </Animated.View>
                                    )}
                                </View>

                                {/* Unvan pill */}
                                <View style={[s.rankPill, { borderColor: curRank.color + '50' }]}>
                                    <Text style={[s.rankPillTxt, { color: curRank.color }]}>{curRank.emoji}  {curRank.label}</Text>
                                </View>

                                {/* Rakip geçildi kutlaması */}
                                {beatenRival && (
                                    <View style={[s.beatenBox, { borderColor: '#ffe000' + '35' }]}>
                                        <Text style={s.beatenTxt}>🎉 {beatenRival}'i geçtin!</Text>
                                    </View>
                                )}

                                {/* Sonraki unvan ilerleme */}
                                {nextRank ? (
                                    <View style={s.progressSection}>
                                        <View style={s.progressBarBg}>
                                            <View style={[s.progressBarFill, { width: `${Math.round(progress * 100)}%` as any, backgroundColor: nextRank.color }]} />
                                        </View>
                                        <Text style={s.progressLabel}>
                                            {nextRank.emoji} {nextRank.label} için{' '}
                                            <Text style={{ color: nextRank.color, fontWeight: '800' }}>{nextRank.min - gs.score} puan</Text>
                                            {' '}eksik
                                        </Text>
                                    </View>
                                ) : (
                                    <Text style={[s.progressLabel, { color: '#ffe000', marginBottom: 10 }]}>🌈 Maksimum unvan — efsanesin!</Text>
                                )}

                                {/* Yeni kupalar */}
                                {newTrophies.length > 0 && (
                                    <View style={[s.card, { borderColor: '#ffe000' + '35', backgroundColor: 'rgba(255,215,0,0.06)' }]}>
                                        <Text style={[s.cardLabel, { color: '#ffe000' }]}>🎉 YENİ KUPA KAZANDIN!</Text>
                                        {newTrophies.map(t => (
                                            <View key={t.id} style={s.newTrophyRow}>
                                                <Text style={s.newTrophyEmoji}>{t.emoji}</Text>
                                                <View>
                                                    <Text style={s.newTrophyName}>{t.name}</Text>
                                                    <Text style={s.newTrophyDesc}>{t.desc}</Text>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                )}

                                {/* Global liderlik tablosu */}
                                <View style={s.card}>
                                    <Text style={s.cardLabel}>
                                        LİDERLİK TABLOSU{lbPosition > 0 ? `  ·  ${lbPosition}. sıraya girdin` : ''}
                                    </Text>
                                    {visibleDead.map((e, i) => {
                                        const r = getRank(e.score);
                                        return (
                                            <View key={i} style={[s.lbRow, e.isPlayer && s.lbRowSelf]}>
                                                <Text style={s.lbMedal}>{medals[i] ?? `${i+1}.`}</Text>
                                                <Text style={[s.lbName, e.isPlayer && s.lbNameSelf]}>
                                                    {e.name}{e.isPlayer ? '  👤' : ''}
                                                </Text>
                                                <Text style={[s.lbScore, { color: r.color }]}>{e.score}</Text>
                                                <Text style={s.lbRankTxt}>{r.emoji}</Text>
                                            </View>
                                        );
                                    })}
                                    {!playerInDead && (
                                        <View style={[s.lbRow, s.lbRowSelf]}>
                                            <Text style={s.lbMedal}>—</Text>
                                            <Text style={[s.lbName, s.lbNameSelf]}>{displayName}  👤</Text>
                                            <Text style={[s.lbScore, { color: curRank.color }]}>{gs.score}</Text>
                                            <Text style={s.lbRankTxt}>{curRank.emoji}</Text>
                                        </View>
                                    )}
                                </View>

                                {/* Tekrar butonu */}
                                <TouchableOpacity style={s.primaryBtn} onPress={startCountdown}>
                                    <Text style={s.primaryBtnTxt}>TEKRAR  ▶</Text>
                                </TouchableOpacity>
                                <Text style={s.orTapHint}>veya herhangi bir yere dokun</Text>

                            </ScrollView>
                        </View>
                    )}
                </View>
            </TouchableWithoutFeedback>

            {/* ── Footer ───────────────────────────────────────────────────── */}
            <View style={[s.footer, { height: footerH, paddingBottom: insets.bottom }]}>
                {gs.phase === 'playing' ? (
                    <>
                        <View style={[s.cubeIndicator, { backgroundColor: cubeColor, shadowColor: cubeColor }]} />
                        <Text style={[s.colorLabel, { color: cubeColor }]}>{colorName}</Text>
                        <View style={s.footerRight}>
                            <Text style={s.footerRankEmoji}>{curRank.emoji}</Text>
                            <Text style={[s.footerRankTxt, { color: curRank.color }]}>{curRank.label}</Text>
                        </View>
                    </>
                ) : gs.phase === 'countdown' ? (
                    <>
                        <View style={[s.cubeIndicator, { backgroundColor: cubeColor, shadowColor: cubeColor }]} />
                        <Text style={[s.colorLabel, { color: cubeColor }]}>{colorName}</Text>
                        <Text style={s.cdFooterHint}>Hazır ol…</Text>
                    </>
                ) : (
                    <View style={s.footerIdle}>
                        {NEONS.map((c, i) => (
                            <View key={i} style={[s.footerDot, { backgroundColor: c }]} />
                        ))}
                        <Text style={s.footerIdleTxt}>{username ? `@${username}` : 'alpgraphics'}</Text>
                        {username && (
                            <TouchableOpacity
                                style={s.changeNameBtn}
                                onPress={() => {
                                    setUsername(null);
                                    setUsernameInput('');
                                    setUsernameError(null);
                                    SecureStore.deleteItemAsync(USERNAME_KEY).catch(() => {});
                                }}
                            >
                                <Text style={s.changeNameTxt}>değiştir</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
        </View>
    );
}

// ─── Stiller ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: BG },

    // ── Header ────────────────────────────────────────────────────────────────
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: SPACING.lg, justifyContent: 'space-between',
    },
    backTxt:   { fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
    liveScore: {
        fontSize: 22, fontWeight: '900',
        position: 'absolute', left: 0, right: 0,
        textAlign: 'center', letterSpacing: 1,
    },
    hiTxt: { fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: '600' },

    // ── Oyun alanı ─────────────────────────────────────────────────────────────
    play:  { backgroundColor: BG, overflow: 'hidden' },
    gridH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.035)' },
    gridV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.02)' },

    // ── Oyun öğeleri ───────────────────────────────────────────────────────────
    obsCol:     { position: 'absolute', top: 0, bottom: 0 },
    band:       { position: 'absolute', left: 0, right: 0 },
    safeBorder: { position: 'absolute', inset: 0, borderWidth: 1.5, borderRadius: 1, opacity: 0.5 },
    orb: {
        position: 'absolute',
        shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 10, elevation: 8,
    },
    cube: {
        position: 'absolute', width: CUBE_W, height: CUBE_W, borderRadius: 4,
        shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 14, elevation: 10,
    },

    // ── Overlay temel (idle + dead) ────────────────────────────────────────────
    overlayBase: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(8,8,16,0.93)',
    },
    scrollContent: {
        flexGrow: 1,
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 24,
    },

    // ── Başlık ────────────────────────────────────────────────────────────────
    titleRow: { flexDirection: 'row', marginBottom: 4 },
    titleA:   { fontSize: 42, fontWeight: '900', color: '#fff', letterSpacing: -1, lineHeight: 48 },
    titleB:   { fontSize: 42, fontWeight: '900', color: '#00e5ff', letterSpacing: -1, lineHeight: 48 },
    tagline:  { fontSize: 10, color: 'rgba(255,255,255,0.28)', letterSpacing: 1, marginBottom: 16 },

    // ── İstatistik satırı ─────────────────────────────────────────────────────
    statsRow: { flexDirection: 'row', gap: 8, width: '100%', marginBottom: 12 },
    statPill: {
        flex: 1, alignItems: 'center', paddingVertical: 9,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    },
    statNum:   { fontSize: 18, fontWeight: '900', color: '#fff' },
    statLabel: { fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: '700', letterSpacing: 0.5, marginTop: 2 },

    // ── Kart (evrensel bölüm kutusu) ──────────────────────────────────────────
    card: {
        width: '100%', marginBottom: 12,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 14, borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        padding: 14,
    },
    cardLabel: {
        fontSize: 9, fontWeight: '800',
        color: 'rgba(255,255,255,0.35)',
        letterSpacing: 1.4, marginBottom: 10,
    },
    cardSub:   { fontSize: 11, color: 'rgba(255,255,255,0.38)', marginBottom: 12, lineHeight: 17 },
    cardLabelRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    cardLabelBadge: {
        marginLeft: 'auto' as any,
        fontSize: 9, fontWeight: '800',
        color: 'rgba(255,255,255,0.5)',
        backgroundColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20,
    },

    // ── Leaderboard satırları ─────────────────────────────────────────────────
    lbRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 6 },
    lbRowSelf: { backgroundColor: 'rgba(0,229,255,0.07)', borderRadius: 7, paddingHorizontal: 5, paddingVertical: 2 },
    lbMedal:  { fontSize: 12, width: 24, textAlign: 'center' },
    lbName:   { fontSize: 12, color: 'rgba(255,255,255,0.5)', flex: 1 },
    lbNameSelf: { color: '#00e5ff', fontWeight: '800' },
    lbScore:  { fontSize: 17, fontWeight: '900', width: 40, textAlign: 'right' },
    lbRankTxt: { fontSize: 14, width: 22, textAlign: 'center' },
    lbEmpty:  { fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center', paddingVertical: 8 },
    refreshTxt: { fontSize: 9, color: 'rgba(255,255,255,0.25)', fontWeight: '700', letterSpacing: 0.5 },

    // ── Kupa rafı ─────────────────────────────────────────────────────────────
    trophyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    trophySlot: { width: '22%', alignItems: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
    trophyEarned: { backgroundColor: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.14)' },
    trophyLocked: { backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' },
    trophyEmoji:  { fontSize: 22, marginBottom: 3 },
    trophyName:   { fontSize: 7.5, color: 'rgba(255,255,255,0.55)', textAlign: 'center', fontWeight: '800' },
    trophyDesc:   { fontSize: 6.5, color: 'rgba(255,255,255,0.28)', textAlign: 'center', marginTop: 2, lineHeight: 9 },

    // ── Birincil buton ────────────────────────────────────────────────────────
    primaryBtn: {
        width: '100%', height: 48,
        backgroundColor: '#00e5ff',
        borderRadius: 12,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 8,
        shadowColor: '#00e5ff', shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
    },
    primaryBtnDisabled: { backgroundColor: 'rgba(0,229,255,0.18)', shadowOpacity: 0 },
    primaryBtnTxt:      { fontSize: 14, fontWeight: '900', color: '#080810', letterSpacing: 1.5 },
    orTapHint:          { fontSize: 10, color: 'rgba(255,255,255,0.17)', letterSpacing: 0.8, marginBottom: 8 },

    // ── Kullanıcı adı input ───────────────────────────────────────────────────
    usernameInput: {
        height: 46, backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 10, paddingHorizontal: 14,
        color: '#fff', fontSize: 16, fontWeight: '700',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
        marginBottom: 6, width: '100%',
    },
    inputError: {
        fontSize: 10, color: '#ff2d78',
        fontWeight: '700', marginBottom: 10,
        alignSelf: 'flex-start',
    },

    // ── Geri sayım ────────────────────────────────────────────────────────────
    cdOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: 'rgba(8,8,16,0.78)',
    },
    cdNum: { fontSize: 96, fontWeight: '900', color: '#fff', textAlign: 'center', lineHeight: 104 },
    cdColorHint: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        borderWidth: 1.5, borderRadius: 30,
        paddingHorizontal: 16, paddingVertical: 8,
        marginBottom: 18, backgroundColor: 'rgba(0,0,0,0.55)',
    },
    cdCube:    { width: 18, height: 18, borderRadius: 3, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 8, elevation: 6 },
    cdHintTxt: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
    cdSubHint: { fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: 0.5, marginTop: 12 },

    // ── Ölüm ekranı ───────────────────────────────────────────────────────────
    deadScoreRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
    deadNum:       { fontSize: 72, fontWeight: '900', lineHeight: 78 },
    newRecordBadge: {
        backgroundColor: 'rgba(255,215,0,0.15)', borderRadius: 20,
        paddingHorizontal: 10, paddingVertical: 5,
        borderWidth: 1, borderColor: 'rgba(255,215,0,0.4)',
    },
    newRecordTxt: { fontSize: 10, fontWeight: '900', color: '#ffe000', letterSpacing: 0.5 },

    rankPill: {
        borderWidth: 1.5, borderRadius: 24,
        paddingHorizontal: 18, paddingVertical: 7, marginBottom: 12,
    },
    rankPillTxt: { fontSize: 14, fontWeight: '800', letterSpacing: 0.3 },

    beatenBox: {
        borderWidth: 1, borderRadius: 10,
        paddingHorizontal: 14, paddingVertical: 8,
        marginBottom: 12, backgroundColor: 'rgba(255,215,0,0.07)',
    },
    beatenTxt: { fontSize: 13, fontWeight: '800', color: '#ffe000', textAlign: 'center' },

    progressSection: { width: '100%', marginBottom: 12 },
    progressBarBg: {
        height: 5, backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 3, overflow: 'hidden', marginBottom: 6,
    },
    progressBarFill: { height: '100%', borderRadius: 3 },
    progressLabel:   { fontSize: 11, color: 'rgba(255,255,255,0.38)', textAlign: 'center' },

    // ── Yeni kupalar ──────────────────────────────────────────────────────────
    newTrophyRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 7 },
    newTrophyEmoji: { fontSize: 28 },
    newTrophyName:  { fontSize: 13, fontWeight: '800', color: '#fff' },
    newTrophyDesc:  { fontSize: 10, color: 'rgba(255,255,255,0.38)', marginTop: 1 },

    // ── Footer ────────────────────────────────────────────────────────────────
    footer: {
        backgroundColor: '#0b0b16', flexDirection: 'row',
        alignItems: 'center', paddingHorizontal: SPACING.lg, gap: 10,
        borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
    },
    cubeIndicator: {
        width: 16, height: 16, borderRadius: 3,
        shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 8, elevation: 6,
    },
    colorLabel:      { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
    footerRight:     { marginLeft: 'auto' as any, flexDirection: 'row', alignItems: 'center', gap: 5 },
    footerRankEmoji: { fontSize: 13 },
    footerRankTxt:   { fontSize: 11, fontWeight: '700' },
    cdFooterHint:    { fontSize: 11, color: 'rgba(255,255,255,0.25)', marginLeft: 'auto' as any },
    footerIdle:      { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
    footerDot:       { width: 6, height: 6, borderRadius: 3, opacity: 0.5 },
    footerIdleTxt:   { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginLeft: 4, letterSpacing: 0.5 },
    changeNameBtn:   { marginLeft: 'auto' as any, paddingVertical: 3, paddingHorizontal: 8 },
    changeNameTxt:   { fontSize: 9, color: 'rgba(255,255,255,0.18)', fontWeight: '600' },
});
