/**
 * Chroma Dash — Tasarımcı Renk Refleks Eğitimi
 *
 * Hikaye: alpgraphics takımının renk algı yarışma sistemi.
 * Kullanıcı adınla tabloya gir, takım arkadaşlarını geç.
 * Kupa kazan, unvan yükselt.
 *
 * Geometry Dash × Color Switch mekanik harmanlama.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableWithoutFeedback,
    TouchableOpacity,
    TextInput,
    Dimensions,
    StatusBar,
    Animated,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { SPACING } from '../lib/constants';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Band    { color: string; y: number; h: number }
interface Obs     { id: number; x: number; bands: Band[]; safeColor: string; passed: boolean }
interface Orb     { id: number; x: number; y: number; color: string }
interface LBEntry { score: number; rankLabel: string }

interface GS {
    phase:          Phase;
    cubeY:          number;
    cubeVY:         number;
    colorIdx:       number;
    obstacles:      Obs[];
    orbs:           Orb[];
    score:          number;
    speed:          number;
    ticks:          number;
    nextId:         number;
    playH:          number;
    orbsCollected:  number;   // Bu run'da toplanan orb sayısı
}

interface Stats {
    totalGames: number;
    maxScore:   number;
    totalOrbs:  number;
}

interface MixedEntry {
    name:      string;
    score:     number;
    isPlayer:  boolean;
    rankLabel: string;
}

type Phase = 'idle' | 'countdown' | 'playing' | 'dead';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'ChromaDash'>;
};

// ─── Sabitler ─────────────────────────────────────────────────────────────────

const { width: SW, height: SH } = Dimensions.get('window');

const NEONS: readonly string[] = ['#00e5ff', '#ff2d78', '#ffe000', '#39ff6a'];
const NAMES: readonly string[] = ['SİYAN', 'PEMBE', 'SARI', 'YEŞİL'];
const BG      = '#080810';
const CUBE_W  = 24;
const CUBE_X  = 72;
const GRAVITY = 0.42;
const JUMP_V  = -9.2;
const BASE_SPD = 3.8;
const OBS_W   = 20;
const OBS_GAP = 280;
const BANDS   = 3;
const ORB_R   = 13;

const LB_KEY       = 'chroma_dash_lb_v1';
const LB_MAX       = 5;
const USERNAME_KEY  = 'chroma_dash_username_v1';
const TROPHY_KEY    = 'chroma_dash_trophies_v1';
const STATS_KEY     = 'chroma_dash_stats_v1';

// ─── Takım rakipleri (simüle edilmiş) ─────────────────────────────────────────

const PRESET_TEAM: { name: string; score: number }[] = [
    { name: 'alp',      score: 58 },
    { name: 'selin',    score: 43 },
    { name: 'stüdyo',   score: 29 },
    { name: 'asistan',  score: 14 },
    { name: 'acemi',    score:  7 },
];

// ─── Kupa Sistemi ─────────────────────────────────────────────────────────────

interface TrophyDef {
    id:    string;
    emoji: string;
    name:  string;
    desc:  string;
    check: (score: number, stats: Stats) => boolean;
}

const TROPHIES: TrophyDef[] = [
    { id: 'start',      emoji: '🎮', name: 'İlk Adım',     desc: 'İlk oyununu oyna',           check: (_s, st) => st.totalGames >= 1    },
    { id: 'designer',   emoji: '🖊️',  name: 'Tasarımcı',   desc: '12+ puan al',                 check: (s)       => s >= 12              },
    { id: 'senior',     emoji: '🎨', name: 'Kıdemli',      desc: '22+ puan al',                 check: (s)       => s >= 22              },
    { id: 'director',   emoji: '⭐', name: 'Direktör',     desc: '35+ puan al',                 check: (s)       => s >= 35              },
    { id: 'god',        emoji: '🌈', name: 'Renk Tanrısı', desc: '50+ puan al',                 check: (s)       => s >= 50              },
    { id: 'veteran',    emoji: '🔥', name: 'Veteran',      desc: '10 kez oyna',                 check: (_s, st) => st.totalGames >= 10   },
    { id: 'orbmaster',  emoji: '💫', name: 'Orb Ustası',   desc: 'Toplam 30 orb topla',         check: (_s, st) => st.totalOrbs  >= 30   },
    { id: 'beat_selin', emoji: '🏅', name: "Selin'i Geç",  desc: "Selin'in skorunu geç (44+)",  check: (s)       => s >= 44              },
];

// ─── Unvan Sistemi ────────────────────────────────────────────────────────────

const RANKS = [
    { min: 0,  label: 'Stajyer',             emoji: '📋', color: '#6b7280' },
    { min: 5,  label: 'Asistan Tasarımcı',   emoji: '✏️',  color: '#9a6700' },
    { min: 12, label: 'Tasarımcı',           emoji: '🖊️',  color: '#3b82f6' },
    { min: 22, label: 'Kıdemli Tasarımcı',   emoji: '🎨',  color: '#8b5cf6' },
    { min: 35, label: 'Direktör',            emoji: '⭐',  color: '#ff2d78' },
    { min: 50, label: 'Renk Tanrısı',        emoji: '🌈',  color: '#ffe000' },
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

function buildMixedLB(playerName: string, playerScore: number): MixedEntry[] {
    return [
        ...PRESET_TEAM.map(t => ({ name: t.name, score: t.score, isPlayer: false, rankLabel: getRank(t.score).label })),
        { name: playerName, score: playerScore, isPlayer: true, rankLabel: getRank(playerScore).label },
    ].sort((a, b) => b.score - a.score);
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
        bands: makeBands(gs.colorIdx, gs.playH, forceMid ? 1 : undefined),
        safeColor: NEONS[gs.colorIdx],
        passed: false,
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

    const [,               setTick]            = useState(0);
    const [leaderboard,    setLeaderboard]     = useState<LBEntry[]>([]);
    const [countdown,      setCountdown]       = useState(3);
    const [username,       setUsername]        = useState<string | null>(null);
    const [usernameInput,  setUsernameInput]   = useState('');
    const [earnedTrophies, setEarnedTrophies]  = useState<Set<string>>(new Set());
    const [stats,          setStats]           = useState<Stats>({ totalGames: 0, maxScore: 0, totalOrbs: 0 });
    const [newTrophies,    setNewTrophies]      = useState<TrophyDef[]>([]);

    const rafRef     = useRef<number | null>(null);
    const cdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const cdAnim     = useRef(new Animated.Value(1)).current;

    const gsRef = useRef<GS>({
        phase: 'idle', cubeY: 0, cubeVY: 0, colorIdx: 0,
        obstacles: [], orbs: [], score: 0,
        speed: BASE_SPD, ticks: 0, nextId: 0, playH,
        orbsCollected: 0,
    });
    gsRef.current.playH = playH;

    // ── İlk yükleme ───────────────────────────────────────────────────────────

    useEffect(() => {
        const load = async () => {
            try {
                // Kullanıcı adı
                const storedName = await SecureStore.getItemAsync(USERNAME_KEY);
                if (storedName) setUsername(storedName);

                // Kişisel skor geçmişi
                const lb = await SecureStore.getItemAsync(LB_KEY);
                if (lb) setLeaderboard(JSON.parse(lb) as LBEntry[]);

                // Kupalar
                const tr = await SecureStore.getItemAsync(TROPHY_KEY);
                if (tr) setEarnedTrophies(new Set(JSON.parse(tr) as string[]));

                // İstatistikler
                const st = await SecureStore.getItemAsync(STATS_KEY);
                if (st) setStats(JSON.parse(st) as Stats);
            } catch { /* sessizce devam */ }
        };
        load();
    }, []);

    // ── Kullanıcı adı onay ────────────────────────────────────────────────────

    const confirmUsername = useCallback(async () => {
        const name = usernameInput.trim().toLowerCase().replace(/\s+/g, '_');
        if (!name) return;
        setUsername(name);
        await SecureStore.setItemAsync(USERNAME_KEY, name).catch(() => {});
    }, [usernameInput]);

    // ── Temizlik ──────────────────────────────────────────────────────────────

    useEffect(() => () => {
        if (rafRef.current)     cancelAnimationFrame(rafRef.current);
        if (cdTimerRef.current) clearInterval(cdTimerRef.current);
    }, []);

    const render = useCallback(() => setTick(t => t + 1), []);

    // ── Ölüm ──────────────────────────────────────────────────────────────────

    const die = useCallback(async (gs: GS) => {
        gs.phase = 'dead';
        if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }

        // Stats güncelle
        const prevStats = await SecureStore.getItemAsync(STATS_KEY)
            .then(v => v ? JSON.parse(v) as Stats : { totalGames: 0, maxScore: 0, totalOrbs: 0 })
            .catch(() => ({ totalGames: 0, maxScore: 0, totalOrbs: 0 }));

        const newStats: Stats = {
            totalGames: prevStats.totalGames + 1,
            maxScore:   Math.max(prevStats.maxScore, gs.score),
            totalOrbs:  prevStats.totalOrbs  + gs.orbsCollected,
        };
        await SecureStore.setItemAsync(STATS_KEY, JSON.stringify(newStats)).catch(() => {});
        setStats(newStats);

        // Kupa kontrolü
        const prevTrophies = await SecureStore.getItemAsync(TROPHY_KEY)
            .then(v => v ? new Set(JSON.parse(v) as string[]) : new Set<string>())
            .catch(() => new Set<string>());

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
            .catch(() => [] as LBEntry[]);
        const newLB = [...prevLB, { score: gs.score, rankLabel: getRank(gs.score).label }]
            .sort((a, b) => b.score - a.score)
            .slice(0, LB_MAX);
        await SecureStore.setItemAsync(LB_KEY, JSON.stringify(newLB)).catch(() => {});
        setLeaderboard(newLB);

        render();
    }, [render]);

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

        // Çarpışma
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

        // Orb toplama
        for (let i = gs.orbs.length - 1; i >= 0; i--) {
            const orb = gs.orbs[i];
            const dx = Math.abs(orb.x - (CUBE_X + CUBE_W / 2));
            const dy = Math.abs(orb.y - (gs.cubeY + CUBE_W / 2));
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
        if (gs.phase === 'idle' || gs.phase === 'dead') {
            if (!username) return; // kullanıcı adı girilmeden başlamaz
            startCountdown();
        } else if (gs.phase === 'countdown') {
            // Geri sayımda zıplanmaz
        } else if (gs.phase === 'playing') {
            gs.cubeVY = JUMP_V;
        }
    }, [startCountdown, username]);

    // ── Hesaplamalar ──────────────────────────────────────────────────────────

    const gs        = gsRef.current;
    const cubeColor = NEONS[gs.colorIdx];
    const colorName = NAMES[gs.colorIdx];
    const curRank   = getRank(gs.score);
    const nextRank  = getNextRank(gs.score);
    const progress  = rankProgress(gs.score);
    const hiScore   = leaderboard[0]?.score ?? 0;

    const displayName  = username ?? '?';
    const mixedIdle    = buildMixedLB(displayName, hiScore);
    const mixedDead    = buildMixedLB(displayName, gs.score);

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <View style={s.root}>
            <StatusBar barStyle="light-content" backgroundColor={BG} />

            {/* ── Header ───────────────────────────────────────────────────── */}
            <View style={[s.header, { paddingTop: insets.top + 8, height: headerH }]}>
                <TouchableOpacity
                    onPress={() => {
                        if (rafRef.current)     cancelAnimationFrame(rafRef.current);
                        if (cdTimerRef.current) clearInterval(cdTimerRef.current);
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
                            <View
                                key={obs.id}
                                style={[s.obsCol, { left: obs.x, width: OBS_W }]}
                                pointerEvents="none"
                            >
                                {obs.bands.map((band, bi) => {
                                    const isSafe = band.color === cubeColor;
                                    return (
                                        <View
                                            key={bi}
                                            style={[
                                                s.band,
                                                {
                                                    top: band.y, height: band.h,
                                                    backgroundColor: band.color,
                                                    opacity: isSafe ? 1 : 0.18,
                                                },
                                            ]}
                                        >
                                            {isSafe && (
                                                <View style={[s.safeBorder, { borderColor: band.color }]} />
                                            )}
                                        </View>
                                    );
                                })}
                            </View>
                        ))
                    }

                    {/* Renk orları */}
                    {gs.orbs.map(orb => (
                        <View
                            key={orb.id}
                            style={[
                                s.orb,
                                {
                                    left: orb.x - ORB_R, top: orb.y - ORB_R,
                                    width: ORB_R * 2, height: ORB_R * 2,
                                    borderRadius: ORB_R,
                                    backgroundColor: orb.color,
                                    shadowColor: orb.color,
                                },
                            ]}
                            pointerEvents="none"
                        />
                    ))}

                    {/* Küp */}
                    {(gs.phase === 'playing' || gs.phase === 'countdown') && (
                        <View
                            style={[
                                s.cube,
                                {
                                    left: CUBE_X, top: gs.cubeY,
                                    backgroundColor: cubeColor,
                                    shadowColor: cubeColor,
                                },
                            ]}
                            pointerEvents="none"
                        />
                    )}

                    {/* ══ KULLANICI ADI GİRİŞİ ════════════════════════════════ */}
                    {gs.phase === 'idle' && !username && (
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={StyleSheet.absoluteFill}
                        >
                            <View style={s.overlay} pointerEvents="box-none">
                                <View style={s.titleRow}>
                                    <Text style={s.titleA}>CHROMA</Text>
                                    <Text style={s.titleB}>DASH</Text>
                                </View>
                                <Text style={s.tagline}>alpgraphics · Renk Algı Eğitimi</Text>

                                <View style={s.usernameBox}>
                                    <Text style={s.usernameBoxTitle}>TAKIM YARIŞMASINA KATIL</Text>
                                    <Text style={s.usernameBoxSub}>
                                        Skor tablonuzda görünecek kullanıcı adını gir
                                    </Text>
                                    <TextInput
                                        style={s.usernameInput}
                                        value={usernameInput}
                                        onChangeText={setUsernameInput}
                                        placeholder="kullanıcı adı"
                                        placeholderTextColor="rgba(255,255,255,0.2)"
                                        maxLength={12}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        returnKeyType="done"
                                        onSubmitEditing={confirmUsername}
                                    />
                                    <TouchableOpacity
                                        style={[
                                            s.usernameBtn,
                                            !usernameInput.trim() && s.usernameBtnDisabled,
                                        ]}
                                        onPress={confirmUsername}
                                        disabled={!usernameInput.trim()}
                                    >
                                        <Text style={s.usernameBtnTxt}>YARIŞA GİR →</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Mevcut takım */}
                                <View style={s.teamPreview}>
                                    <Text style={s.teamPreviewTitle}>MEVCUT TAKIMLAR</Text>
                                    {PRESET_TEAM.slice(0, 4).map((t, i) => {
                                        const r = getRank(t.score);
                                        return (
                                            <View key={i} style={s.teamPreviewRow}>
                                                <Text style={s.teamPreviewName}>{t.name}</Text>
                                                <Text style={[s.teamPreviewScore, { color: r.color }]}>
                                                    {t.score}
                                                </Text>
                                                <Text style={s.teamPreviewRank}>{r.emoji} {r.label}</Text>
                                            </View>
                                        );
                                    })}
                                    <Text style={s.teamPreviewEtc}>+{PRESET_TEAM.length - 4} diğer...</Text>
                                </View>
                            </View>
                        </KeyboardAvoidingView>
                    )}

                    {/* ══ BOŞTA EKRANI (kullanıcı adı var) ═══════════════════ */}
                    {gs.phase === 'idle' && username && (
                        <View style={s.overlay} pointerEvents="none">
                            <View style={s.titleRow}>
                                <Text style={s.titleA}>CHROMA</Text>
                                <Text style={s.titleB}>DASH</Text>
                            </View>
                            <Text style={s.tagline}>alpgraphics · Renk Algı Eğitimi</Text>

                            {/* Karışık skor tablosu */}
                            <View style={s.lbCard}>
                                <Text style={s.lbTitle}>TAKIM SKOR TABLOSU</Text>
                                {mixedIdle.map((e, i) => {
                                    const rank = getRank(e.score);
                                    const medals = ['🥇', '🥈', '🥉', '  4', '  5', '  6'];
                                    return (
                                        <View key={i} style={[s.lbRow, e.isPlayer && s.lbRowPlayer]}>
                                            <Text style={s.lbMedal}>{medals[i] ?? `${i+1}.`}</Text>
                                            <Text style={[s.lbName, e.isPlayer && s.lbNamePlayer]}>
                                                {e.name}{e.isPlayer ? ' 👤' : ''}
                                            </Text>
                                            <Text style={[s.lbScore, { color: rank.color }]}>
                                                {e.score > 0 ? e.score : '—'}
                                            </Text>
                                            <Text style={s.lbRankTxt}>{rank.emoji}</Text>
                                        </View>
                                    );
                                })}
                            </View>

                            {/* Kupa rafı */}
                            <View style={s.trophyShelf}>
                                <Text style={s.trophyShelfTitle}>
                                    KUPALAR  {earnedTrophies.size}/{TROPHIES.length}
                                </Text>
                                <View style={s.trophyGrid}>
                                    {TROPHIES.map(t => {
                                        const earned = earnedTrophies.has(t.id);
                                        return (
                                            <View
                                                key={t.id}
                                                style={[
                                                    s.trophySlot,
                                                    earned ? s.trophyEarned : s.trophyLocked,
                                                ]}
                                            >
                                                <Text style={[s.trophyEmoji, !earned && { opacity: 0.15 }]}>
                                                    {t.emoji}
                                                </Text>
                                                <Text style={[s.trophyName, !earned && { opacity: 0.2 }]}>
                                                    {earned ? t.name : '???'}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>

                            <Text style={s.tapHint}>— dokun, başla —</Text>
                        </View>
                    )}

                    {/* ══ GERİ SAYIM ═══════════════════════════════════════════ */}
                    {gs.phase === 'countdown' && (
                        <View style={s.cdOverlay} pointerEvents="none">
                            <View style={[s.cdColorHint, { borderColor: cubeColor }]}>
                                <View style={[s.cdCube, { backgroundColor: cubeColor, shadowColor: cubeColor }]} />
                                <Text style={[s.cdHintTxt, { color: cubeColor }]}>
                                    {colorName} BÖLGEDEN GEÇ
                                </Text>
                            </View>
                            <Animated.Text style={[
                                s.cdNum,
                                {
                                    opacity: cdAnim,
                                    transform: [{
                                        scale: cdAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.6, 1.2],
                                        }),
                                    }],
                                },
                            ]}>
                                {countdown > 0 ? countdown : 'GİT!'}
                            </Animated.Text>
                        </View>
                    )}

                    {/* ══ ÖLÜM EKRANI ══════════════════════════════════════════ */}
                    {gs.phase === 'dead' && (
                        <View style={s.overlay} pointerEvents="none">
                            {/* Skor */}
                            <Text style={[s.deadNum, { color: curRank.color }]}>{gs.score}</Text>

                            {/* Unvan pill */}
                            <View style={[s.rankPill, { borderColor: curRank.color + '44' }]}>
                                <Text style={[s.rankPillTxt, { color: curRank.color }]}>
                                    {curRank.emoji}  {curRank.label}
                                </Text>
                            </View>

                            {/* Sonraki unvana ilerleme */}
                            {nextRank ? (
                                <View style={s.progressSection}>
                                    <View style={s.progressBarBg}>
                                        <View style={[s.progressBarFill, {
                                            width: `${Math.round(progress * 100)}%` as any,
                                            backgroundColor: nextRank.color,
                                        }]} />
                                    </View>
                                    <Text style={s.progressLabel}>
                                        {nextRank.emoji} {nextRank.label} için{' '}
                                        <Text style={{ color: nextRank.color, fontWeight: '800' }}>
                                            {nextRank.min - gs.score} puan
                                        </Text>
                                        {' '}eksik
                                    </Text>
                                </View>
                            ) : (
                                <Text style={[s.progressLabel, { color: '#ffe000', marginBottom: 8 }]}>
                                    🌈 Maksimum unvan! Efsanesin.
                                </Text>
                            )}

                            {/* Yeni kupalar */}
                            {newTrophies.length > 0 && (
                                <View style={s.newTrophiesBox}>
                                    <Text style={s.newTrophiesTitle}>🎉 YENİ KUPA KAZANDIN!</Text>
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

                            {/* Karışık skor tablosu */}
                            <View style={s.lbCard}>
                                <Text style={s.lbTitle}>TAKIM SKOR TABLOSU</Text>
                                {mixedDead.map((e, i) => {
                                    const rank = getRank(e.score);
                                    const medals = ['🥇', '🥈', '🥉', '  4', '  5', '  6'];
                                    return (
                                        <View key={i} style={[s.lbRow, e.isPlayer && s.lbRowPlayer]}>
                                            <Text style={s.lbMedal}>{medals[i] ?? `${i+1}.`}</Text>
                                            <Text style={[s.lbName, e.isPlayer && s.lbNamePlayer]}>
                                                {e.name}{e.isPlayer ? ' 👤' : ''}
                                            </Text>
                                            <Text style={[s.lbScore, { color: rank.color }]}>
                                                {e.score}
                                            </Text>
                                            <Text style={s.lbRankTxt}>{rank.emoji}</Text>
                                        </View>
                                    );
                                })}
                            </View>

                            <Text style={s.tapHint}>— dokun, tekrar —</Text>
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
                        <Text style={s.footerIdleTxt}>
                            {username ? `@${username}` : 'alpgraphics · renk eğitimi'}
                        </Text>
                        {username && (
                            <TouchableOpacity
                                style={s.changeNameBtn}
                                onPress={() => {
                                    setUsername(null);
                                    setUsernameInput('');
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

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: SPACING.lg, justifyContent: 'space-between',
    },
    backTxt:   { fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: '600' },
    liveScore: { fontSize: 22, fontWeight: '900', position: 'absolute', left: 0, right: 0, textAlign: 'center', letterSpacing: 1 },
    hiTxt:     { fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: '600' },

    // Oyun alanı
    play:  { backgroundColor: BG, overflow: 'hidden' },
    gridH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.04)' },
    gridV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.025)' },

    // Engel & band
    obsCol:     { position: 'absolute', top: 0, bottom: 0 },
    band:       { position: 'absolute', left: 0, right: 0 },
    safeBorder: { position: 'absolute', inset: 0, borderWidth: 1.5, borderRadius: 1, opacity: 0.6 },

    // Orb
    orb: {
        position: 'absolute',
        shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 10, elevation: 8,
    },

    // Küp
    cube: {
        position: 'absolute', width: CUBE_W, height: CUBE_W, borderRadius: 4,
        shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 12, elevation: 10,
    },

    // Genel overlay
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: 'rgba(8,8,16,0.92)',
        paddingHorizontal: 20,
    },

    // ── Başlık ──────────────────────────────────────────────────────────────
    titleRow: { flexDirection: 'row', marginBottom: 4 },
    titleA:   { fontSize: 40, fontWeight: '900', color: '#fff', letterSpacing: -1, lineHeight: 46 },
    titleB:   { fontSize: 40, fontWeight: '900', color: '#00e5ff', letterSpacing: -1, lineHeight: 46 },
    tagline:  { fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 12 },

    // ── Kullanıcı adı kutusu ─────────────────────────────────────────────────
    usernameBox: {
        backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14,
        padding: 16, width: '100%', marginBottom: 12,
        borderWidth: 1, borderColor: 'rgba(0,229,255,0.2)',
    },
    usernameBoxTitle: { fontSize: 9, fontWeight: '800', color: '#00e5ff', letterSpacing: 1.5, marginBottom: 4 },
    usernameBoxSub:   { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 12 },
    usernameInput: {
        height: 44, backgroundColor: 'rgba(255,255,255,0.07)',
        borderRadius: 10, paddingHorizontal: 14,
        color: '#ffffff', fontSize: 16, fontWeight: '700',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
        marginBottom: 10,
    },
    usernameBtn: {
        backgroundColor: '#00e5ff', borderRadius: 10, height: 42,
        justifyContent: 'center', alignItems: 'center',
    },
    usernameBtnDisabled: { backgroundColor: 'rgba(0,229,255,0.2)' },
    usernameBtnTxt: { fontSize: 13, fontWeight: '900', color: '#080810', letterSpacing: 1 },

    // ── Takım önizleme (kullanıcı adı ekranı) ───────────────────────────────
    teamPreview: {
        backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10,
        padding: 12, width: '100%',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    },
    teamPreviewTitle: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.3)', letterSpacing: 1.2, marginBottom: 8 },
    teamPreviewRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 5, gap: 8 },
    teamPreviewName:  { fontSize: 12, color: 'rgba(255,255,255,0.55)', width: 64 },
    teamPreviewScore: { fontSize: 14, fontWeight: '900', width: 28 },
    teamPreviewRank:  { fontSize: 11, color: 'rgba(255,255,255,0.4)', flex: 1 },
    teamPreviewEtc:   { fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 2 },

    // ── Leaderboard ─────────────────────────────────────────────────────────
    lbCard: {
        backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12,
        padding: 12, width: '100%', marginBottom: 10,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    },
    lbTitle:      { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.35)', letterSpacing: 1.2, marginBottom: 8 },
    lbRow:        { flexDirection: 'row', alignItems: 'center', marginBottom: 5, gap: 6 },
    lbRowPlayer:  { backgroundColor: 'rgba(0,229,255,0.07)', borderRadius: 6, paddingHorizontal: 4, paddingVertical: 1 },
    lbMedal:      { fontSize: 12, width: 22, textAlign: 'center' },
    lbName:       { fontSize: 12, color: 'rgba(255,255,255,0.5)', flex: 1 },
    lbNamePlayer: { color: '#00e5ff', fontWeight: '800' },
    lbScore:      { fontSize: 16, fontWeight: '900', width: 38, textAlign: 'right' },
    lbRankTxt:    { fontSize: 13, width: 22, textAlign: 'center' },

    // ── Kupa rafı ───────────────────────────────────────────────────────────
    trophyShelf: {
        backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12,
        padding: 12, width: '100%', marginBottom: 10,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    },
    trophyShelfTitle: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.35)', letterSpacing: 1.2, marginBottom: 10 },
    trophyGrid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between',
    },
    trophySlot: {
        width: '22%', alignItems: 'center', paddingVertical: 8,
        borderRadius: 10, borderWidth: 1,
    },
    trophyEarned: {
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderColor: 'rgba(255,255,255,0.15)',
    },
    trophyLocked: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderColor: 'rgba(255,255,255,0.06)',
    },
    trophyEmoji: { fontSize: 22, marginBottom: 3 },
    trophyName:  { fontSize: 8, color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontWeight: '700' },

    tapHint: { fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: 1.2, marginTop: 4 },

    // ── Geri sayım ──────────────────────────────────────────────────────────
    cdOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: 'rgba(8,8,16,0.72)',
    },
    cdNum: {
        fontSize: 96, fontWeight: '900', color: '#ffffff',
        textAlign: 'center', lineHeight: 104,
    },
    cdColorHint: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        borderWidth: 1.5, borderRadius: 30,
        paddingHorizontal: 16, paddingVertical: 8,
        marginBottom: 16, backgroundColor: 'rgba(0,0,0,0.5)',
    },
    cdCube: {
        width: 18, height: 18, borderRadius: 3,
        shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 8, elevation: 6,
    },
    cdHintTxt: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },

    // ── Ölüm ────────────────────────────────────────────────────────────────
    deadNum: {
        fontSize: 68, fontWeight: '900', lineHeight: 74, marginBottom: 6,
    },
    rankPill: {
        borderWidth: 1.5, borderRadius: 24,
        paddingHorizontal: 16, paddingVertical: 6, marginBottom: 10,
    },
    rankPillTxt:  { fontSize: 14, fontWeight: '800', letterSpacing: 0.3 },
    progressSection: { width: '100%', marginBottom: 8 },
    progressBarBg: {
        height: 5, backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 3, overflow: 'hidden', marginBottom: 6,
    },
    progressBarFill: { height: '100%', borderRadius: 3 },
    progressLabel:   { fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },

    // ── Yeni kupalar ────────────────────────────────────────────────────────
    newTrophiesBox: {
        backgroundColor: 'rgba(255,215,0,0.08)', borderRadius: 12,
        padding: 12, width: '100%', marginBottom: 10,
        borderWidth: 1, borderColor: 'rgba(255,215,0,0.25)',
    },
    newTrophiesTitle: { fontSize: 10, fontWeight: '900', color: '#ffe000', letterSpacing: 1, marginBottom: 8 },
    newTrophyRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
    newTrophyEmoji:   { fontSize: 26 },
    newTrophyName:    { fontSize: 13, fontWeight: '800', color: '#ffffff' },
    newTrophyDesc:    { fontSize: 10, color: 'rgba(255,255,255,0.4)' },

    // ── Footer ──────────────────────────────────────────────────────────────
    footer: {
        backgroundColor: '#0d0d18', flexDirection: 'row',
        alignItems: 'center', paddingHorizontal: SPACING.lg, gap: 10,
        borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
    },
    cubeIndicator: {
        width: 18, height: 18, borderRadius: 3,
        shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 8, elevation: 6,
    },
    colorLabel:      { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
    footerRight:     { marginLeft: 'auto' as any, flexDirection: 'row', alignItems: 'center', gap: 5 },
    footerRankEmoji: { fontSize: 13 },
    footerRankTxt:   { fontSize: 11, fontWeight: '700' },
    cdFooterHint:    { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' as any },
    footerIdle:      { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
    footerDot:       { width: 7, height: 7, borderRadius: 4, opacity: 0.5 },
    footerIdleTxt:   { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginLeft: 4, letterSpacing: 0.5 },
    changeNameBtn:   { marginLeft: 'auto' as any, paddingVertical: 2, paddingHorizontal: 8 },
    changeNameTxt:   { fontSize: 9, color: 'rgba(255,255,255,0.2)', fontWeight: '600' },
});
