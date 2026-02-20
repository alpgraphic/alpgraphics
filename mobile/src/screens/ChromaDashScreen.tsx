/**
 * Chroma Dash — Tasarımcı Renk Refleks Eğitimi
 *
 * Hikaye: alpgraphics tasarım stüdyosunun renk algı eğitim sistemi.
 * Giriş ekranı seni unvanından ve rakiplerinden haberdar eder.
 * Geometry Dash × Color Switch mekanik harmanlama.
 *
 * Mekanik:
 *  - Küp gravity altında düşer, tap ile zıplar
 *  - Engeller sağdan sola kayar — 3 renkli bant içerir
 *  - Küp SADECE kendi rengiyle eşleşen banttan geçer
 *  - Renk küreleri anında rengi değiştirir → adaptasyon gerekir
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableWithoutFeedback,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { SPACING } from '../lib/constants';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Band { color: string; y: number; h: number }
interface Obs  { id: number; x: number; bands: Band[]; safeColor: string; passed: boolean }
interface Orb  { id: number; x: number; y: number; color: string }
interface LBEntry { score: number; rankLabel: string }

interface GS {
    phase:    Phase;
    cubeY:    number;
    cubeVY:   number;
    colorIdx: number;
    obstacles: Obs[];
    orbs:      Orb[];
    score:    number;
    speed:    number;
    ticks:    number;
    nextId:   number;
    playH:    number;
}

type Phase = 'idle' | 'countdown' | 'playing' | 'dead';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'ChromaDash'>;
};

// ─── Sabitler ─────────────────────────────────────────────────────────────────

const { width: SW, height: SH } = Dimensions.get('window');

const NEONS: readonly string[] = ['#00e5ff', '#ff2d78', '#ffe000', '#39ff6a'];
const NAMES: readonly string[] = ['SİYAN', 'PEMBE', 'SARI', 'YEŞİL'];
const BG     = '#080810';
const CUBE_W = 24;
const CUBE_X = 72;
const GRAVITY  = 0.42;
const JUMP_V   = -9.2;
const BASE_SPD = 3.8;
const OBS_W    = 20;
const OBS_GAP  = 280;
const BANDS    = 3;
const ORB_R    = 13;
const LB_KEY   = 'chroma_dash_lb_v1';
const LB_MAX   = 5;

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
    const span = next.min - cur.min;
    const done = score - cur.min;
    return Math.min(1, done / span);
}

// ─── Yardımcılar ──────────────────────────────────────────────────────────────

function rnd(n: number) { return Math.floor(Math.random() * n); }

function makeBands(safeColorIdx: number, playH: number, safeBandPos?: number): Band[] {
    const h = playH / BANDS;
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

    const [tick,        setTick]        = useState(0);
    const [leaderboard, setLeaderboard] = useState<LBEntry[]>([]);
    const [countdown,   setCountdown]   = useState(3);

    const rafRef     = useRef<number | null>(null);
    const cdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const cdAnim     = useRef(new Animated.Value(1)).current;

    const gsRef = useRef<GS>({
        phase: 'idle', cubeY: 0, cubeVY: 0, colorIdx: 0,
        obstacles: [], orbs: [], score: 0,
        speed: BASE_SPD, ticks: 0, nextId: 0, playH,
    });
    gsRef.current.playH = playH;

    // ── Leaderboard yükle ─────────────────────────────────────────────────────

    useEffect(() => {
        SecureStore.getItemAsync(LB_KEY)
            .then(v => { if (v) setLeaderboard(JSON.parse(v) as LBEntry[]); })
            .catch(() => {});
    }, []);

    const saveToLeaderboard = useCallback(async (score: number) => {
        const entry: LBEntry = { score, rankLabel: getRank(score).label };
        const updated = [...leaderboard, entry]
            .sort((a, b) => b.score - a.score)
            .slice(0, LB_MAX);
        setLeaderboard(updated);
        await SecureStore.setItemAsync(LB_KEY, JSON.stringify(updated)).catch(() => {});
        return updated;
    }, [leaderboard]);

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
        await saveToLeaderboard(gs.score);
        render();
    }, [saveToLeaderboard, render]);

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
                patchNextObs(gs, newIdx);
            }
        }

        render();
        rafRef.current = requestAnimationFrame(gameLoop);
    }, [die, render]);

    // ── Geri sayım ────────────────────────────────────────────────────────────

    const startCountdown = useCallback(() => {
        const gs = gsRef.current;
        gs.phase     = 'countdown';
        gs.cubeY     = gs.playH / 2 - CUBE_W / 2;
        gs.cubeVY    = 0;
        gs.colorIdx  = 0;
        gs.obstacles = [];
        gs.orbs      = [];
        gs.score     = 0;
        gs.speed     = BASE_SPD;
        gs.ticks     = 0;
        gs.nextId    = 0;
        for (let i = 0; i < 3; i++) {
            gs.obstacles.push(spawnObs(gs, SW + 200 + i * OBS_GAP, i === 0));
        }

        setCountdown(3);
        render();

        // Geri sayım animasyonu
        let count = 3;
        const tick = () => {
            cdAnim.setValue(1);
            Animated.timing(cdAnim, { toValue: 0, duration: 850, useNativeDriver: true }).start();
        };
        tick();

        cdTimerRef.current = setInterval(() => {
            count -= 1;
            setCountdown(count);
            if (count > 0) {
                tick();
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
            startCountdown();
        } else if (gs.phase === 'countdown') {
            // Geri sayımda dokunuş zıplamaz — bekle
        } else if (gs.phase === 'playing') {
            gs.cubeVY = JUMP_V;
        }
    }, [startCountdown]);

    // ── Render ────────────────────────────────────────────────────────────────

    const gs         = gsRef.current;
    const cubeColor  = NEONS[gs.colorIdx];
    const colorName  = NAMES[gs.colorIdx];
    const curRank    = getRank(gs.score);
    const nextRank   = getNextRank(gs.score);
    const progress   = rankProgress(gs.score);
    const hiScore    = leaderboard[0]?.score ?? 0;

    // Leaderboard'daki pozisyon (dead ekranı için)
    const lbPosition = gs.phase === 'dead'
        ? leaderboard.findIndex(e => e.score === gs.score) + 1
        : 0;

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

                    {/* ── BOŞTA EKRANI ─────────────────────────────────────── */}
                    {gs.phase === 'idle' && (
                        <View style={s.overlay} pointerEvents="none">
                            {/* Başlık */}
                            <View style={s.titleRow}>
                                <Text style={s.titleA}>CHROMA</Text>
                                <Text style={s.titleB}>DASH</Text>
                            </View>
                            <Text style={s.tagline}>alpgraphics · Renk Algı Eğitimi</Text>

                            {/* Leaderboard */}
                            {leaderboard.length > 0 ? (
                                <View style={s.lbCard}>
                                    <Text style={s.lbTitle}>KİŞİSEL SKOR TABLOSU</Text>
                                    {leaderboard.slice(0, 5).map((e, i) => {
                                        const rank = getRank(e.score);
                                        const medals = ['🥇', '🥈', '🥉', '  4', '  5'];
                                        return (
                                            <View key={i} style={s.lbRow}>
                                                <Text style={s.lbMedal}>{medals[i]}</Text>
                                                <Text style={[s.lbScore, { color: rank.color }]}>
                                                    {e.score}
                                                </Text>
                                                <Text style={s.lbRankTxt}>
                                                    {rank.emoji} {e.rankLabel}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            ) : (
                                <View style={s.lbCard}>
                                    <Text style={s.lbTitle}>HEDEFLER</Text>
                                    {RANKS.map((r, i) => (
                                        <View key={i} style={s.lbRow}>
                                            <Text style={s.lbMedal}>{r.emoji}</Text>
                                            <Text style={[s.lbScore, { color: r.color }]}>{r.min}+</Text>
                                            <Text style={s.lbRankTxt}>{r.label}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Nasıl oynanır */}
                            <View style={s.howCard}>
                                <Text style={s.howRow}>🔲  Rengini gör, aynı renkli bandın önüne geç</Text>
                                <Text style={s.howRow}>⚡  Neon küreler rengini değiştirir — hızla adapt ol</Text>
                                <Text style={s.howRow}>🕹  Tap → Zıpla   /   Zemin & Tavan = Ölüm</Text>
                            </View>

                            <Text style={s.tapHint}>— dokun, başla —</Text>
                        </View>
                    )}

                    {/* ── GERİ SAYIM ───────────────────────────────────────── */}
                    {gs.phase === 'countdown' && (
                        <View style={s.cdOverlay} pointerEvents="none">
                            <View style={[s.cdColorHint, { borderColor: cubeColor }]}>
                                <View style={[s.cdCube, { backgroundColor: cubeColor, shadowColor: cubeColor }]} />
                                <Text style={[s.cdHintTxt, { color: cubeColor }]}>
                                    {colorName} BÖLGEDEN GEÇ
                                </Text>
                            </View>
                            <Animated.Text style={[s.cdNum, { opacity: cdAnim, transform: [{ scale: cdAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.2] }) }] }]}>
                                {countdown > 0 ? countdown : 'GİT!'}
                            </Animated.Text>
                        </View>
                    )}

                    {/* ── ÖLÜM EKRANI ──────────────────────────────────────── */}
                    {gs.phase === 'dead' && (
                        <View style={s.overlay} pointerEvents="none">
                            {/* Skor */}
                            <Text style={[s.deadNum, { color: curRank.color }]}>{gs.score}</Text>

                            {/* Kazanılan unvan */}
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
                                <Text style={[s.progressLabel, { color: '#ffe000' }]}>
                                    🌈 Maksimum unvan! Efsanesin.
                                </Text>
                            )}

                            {/* Leaderboard */}
                            {leaderboard.length > 0 && (
                                <View style={s.lbCard}>
                                    <Text style={s.lbTitle}>
                                        SKOR TABLONUZ
                                        {lbPosition > 0 && ` — #${lbPosition} sırada girdin`}
                                    </Text>
                                    {leaderboard.slice(0, 5).map((e, i) => {
                                        const r = getRank(e.score);
                                        const isThisRun = e.score === gs.score &&
                                            i === leaderboard.findIndex(x => x.score === gs.score);
                                        return (
                                            <View key={i} style={[s.lbRow, isThisRun && s.lbRowHighlight]}>
                                                <Text style={s.lbMedal}>
                                                    {isThisRun ? '→' : `${i + 1}.`}
                                                </Text>
                                                <Text style={[s.lbScore, { color: r.color }]}>{e.score}</Text>
                                                <Text style={s.lbRankTxt}>{r.emoji} {e.rankLabel}</Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            )}

                            <Text style={s.tapHint}>— dokun, tekrar —</Text>
                        </View>
                    )}
                </View>
            </TouchableWithoutFeedback>

            {/* ── Footer — renk göstergesi ─────────────────────────────────── */}
            <View style={[s.footer, { height: footerH, paddingBottom: insets.bottom }]}>
                {gs.phase === 'playing' ? (
                    <>
                        <View style={[s.cubeIndicator, { backgroundColor: cubeColor, shadowColor: cubeColor }]} />
                        <Text style={[s.colorLabel, { color: cubeColor }]}>{colorName}</Text>
                        <View style={s.footerRight}>
                            <Text style={s.footerRankEmoji}>{curRank.emoji}</Text>
                            <Text style={[s.footerRankTxt, { color: curRank.color }]}>
                                {curRank.label}
                            </Text>
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
                        <Text style={s.footerIdleTxt}>alpgraphics · renk eğitimi</Text>
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
    play: { backgroundColor: BG, overflow: 'hidden' },
    gridH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.04)' },
    gridV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.025)' },

    // Engel & band
    obsCol: { position: 'absolute', top: 0, bottom: 0 },
    band:   { position: 'absolute', left: 0, right: 0 },
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

    // Genel overlay kapsayıcı
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: 'rgba(8,8,16,0.88)',
        paddingHorizontal: 24,
    },

    // ── Boşta ──────────────────────────────────────────────────────────────────
    titleRow:  { flexDirection: 'row', gap: 0, marginBottom: 4 },
    titleA:    { fontSize: 44, fontWeight: '900', color: '#fff', letterSpacing: -1, lineHeight: 50 },
    titleB:    { fontSize: 44, fontWeight: '900', color: '#00e5ff', letterSpacing: -1, lineHeight: 50 },
    tagline:   { fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 14 },

    // Leaderboard kartı (paylaşılan: idle + dead)
    lbCard: {
        backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12,
        padding: 12, width: '100%', marginBottom: 10,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    },
    lbTitle:   { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.35)', letterSpacing: 1.2, marginBottom: 8 },
    lbRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 5, gap: 8 },
    lbRowHighlight: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 6, paddingHorizontal: 4 },
    lbMedal:   { fontSize: 12, width: 22, textAlign: 'center' },
    lbScore:   { fontSize: 18, fontWeight: '900', width: 44 },
    lbRankTxt: { fontSize: 12, color: 'rgba(255,255,255,0.5)', flex: 1 },

    howCard: {
        backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10,
        padding: 10, width: '100%', marginBottom: 14,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    },
    howRow: { fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 21 },

    tapHint: { fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: 1.2, marginTop: 4 },

    // ── Geri sayım ─────────────────────────────────────────────────────────────
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
        marginBottom: 16,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    cdCube: {
        width: 18, height: 18, borderRadius: 3,
        shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 8, elevation: 6,
    },
    cdHintTxt: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },

    // ── Ölüm ─────────────────────────────────────────────────────────────────
    deadNum: {
        fontSize: 72, fontWeight: '900', lineHeight: 78, marginBottom: 6,
    },
    rankPill: {
        borderWidth: 1.5, borderRadius: 24,
        paddingHorizontal: 16, paddingVertical: 6, marginBottom: 14,
    },
    rankPillTxt: { fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
    progressSection: { width: '100%', marginBottom: 10 },
    progressBarBg: {
        height: 5, backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 3, overflow: 'hidden', marginBottom: 6,
    },
    progressBarFill: { height: '100%', borderRadius: 3 },
    progressLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },

    // ── Footer ─────────────────────────────────────────────────────────────────
    footer: {
        backgroundColor: '#0d0d18', flexDirection: 'row',
        alignItems: 'center', paddingHorizontal: SPACING.lg, gap: 10,
        borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
    },
    cubeIndicator: {
        width: 18, height: 18, borderRadius: 3,
        shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 8, elevation: 6,
    },
    colorLabel:   { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
    footerRight:  { marginLeft: 'auto' as any, flexDirection: 'row', alignItems: 'center', gap: 5 },
    footerRankEmoji: { fontSize: 13 },
    footerRankTxt:   { fontSize: 11, fontWeight: '700' },
    cdFooterHint:    { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' as any },
    footerIdle:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
    footerDot:    { width: 7, height: 7, borderRadius: 4, opacity: 0.5 },
    footerIdleTxt: { fontSize: 10, color: 'rgba(255,255,255,0.2)', marginLeft: 4, letterSpacing: 0.5 },
});
